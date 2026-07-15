import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { canAccess, canManage } from './access.util';
import { fileToHtml, titleFromFilename } from './import.util';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: number) {
    const docs = await this.prisma.document.findMany({
      where: {
        OR: [{ ownerId: userId }, { shares: { some: { userId } } }],
      },
      include: { owner: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      ownerId: d.ownerId,
      ownerName: d.owner.name,
      isOwner: d.ownerId === userId,
      updatedAt: d.updatedAt,
      createdAt: d.createdAt,
    }));
  }

  private async findWithShares(id: number) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { shares: true, owner: { select: { name: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getIfAccessible(id: number, userId: number) {
    const doc = await this.findWithShares(id);
    const access = { ownerId: doc.ownerId, sharedUserIds: doc.shares.map((s) => s.userId) };
    if (!canAccess(access, userId)) throw new NotFoundException('Document not found');

    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      ownerId: doc.ownerId,
      ownerName: doc.owner.name,
      isOwner: doc.ownerId === userId,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    };
  }

  async create(ownerId: number, title = 'Untitled document', content = '') {
    return this.prisma.document.create({ data: { ownerId, title, content } });
  }

  async createFromUpload(ownerId: number, filename: string, buffer: Buffer) {
    const html = fileToHtml(filename, buffer.toString('utf-8'));
    if (html === null) {
      throw new BadRequestException(
        'Unsupported file type. Only .txt and .md files are supported.',
      );
    }
    return this.create(ownerId, titleFromFilename(filename), html);
  }

  async update(id: number, userId: number, data: { title?: string; content?: string }) {
    const doc = await this.findWithShares(id);
    const access = { ownerId: doc.ownerId, sharedUserIds: doc.shares.map((s) => s.userId) };
    if (!canAccess(access, userId)) throw new NotFoundException('Document not found');

    if (data.title !== undefined && !canManage(access, userId)) {
      throw new ForbiddenException('Only the owner can rename this document');
    }
    if (data.title !== undefined && data.title.trim() === '') {
      throw new BadRequestException('Title cannot be empty');
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
      },
    });
  }

  async remove(id: number, userId: number) {
    const doc = await this.findWithShares(id);
    if (!canManage({ ownerId: doc.ownerId, sharedUserIds: [] }, userId)) {
      throw new ForbiddenException('Only the owner can delete this document');
    }
    await this.prisma.document.delete({ where: { id } });
  }

  async listShares(id: number, userId: number) {
    const doc = await this.findWithShares(id);
    if (!canManage({ ownerId: doc.ownerId, sharedUserIds: [] }, userId)) {
      throw new ForbiddenException('Only the owner can view sharing settings');
    }
    const shares = await this.prisma.documentShare.findMany({
      where: { documentId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return shares.map((s) => s.user);
  }

  async share(id: number, userId: number, email: string) {
    const doc = await this.findWithShares(id);
    if (!canManage({ ownerId: doc.ownerId, sharedUserIds: [] }, userId)) {
      throw new ForbiddenException('Only the owner can share this document');
    }

    const target = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!target) throw new NotFoundException('No user with that email');
    if (target.id === doc.ownerId) {
      throw new ConflictException('That user already owns this document');
    }

    await this.prisma.documentShare.upsert({
      where: { documentId_userId: { documentId: id, userId: target.id } },
      update: {},
      create: { documentId: id, userId: target.id },
    });
    return this.listShares(id, userId);
  }

  async unshare(id: number, userId: number, targetUserId: number) {
    const doc = await this.findWithShares(id);
    if (!canManage({ ownerId: doc.ownerId, sharedUserIds: [] }, userId)) {
      throw new ForbiddenException('Only the owner can manage sharing');
    }
    await this.prisma.documentShare.deleteMany({
      where: { documentId: id, userId: targetUserId },
    });
    return this.listShares(id, userId);
  }
}
