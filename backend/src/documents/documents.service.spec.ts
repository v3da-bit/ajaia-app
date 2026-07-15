import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma.service';

describe('DocumentsService', () => {
  const OWNER = 1;
  const SHARED_USER = 2;
  const STRANGER = 3;

  const doc = {
    id: 10,
    title: 'Doc',
    content: 'hi',
    ownerId: OWNER,
    shares: [{ documentId: 10, userId: SHARED_USER }],
    owner: { name: 'Alice' },
  };

  function makeService() {
    const prisma = {
      document: {
        findUnique: jest.fn().mockResolvedValue(doc),
        update: jest.fn().mockImplementation(({ data }) => ({ ...doc, ...data })),
      },
    } as unknown as PrismaService;
    return new DocumentsService(prisma);
  }

  it('lets a shared user edit content but not the title', async () => {
    const service = makeService();
    await expect(
      service.update(doc.id, SHARED_USER, { title: 'Renamed' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const updated = await service.update(doc.id, SHARED_USER, { content: 'edited' });
    expect(updated.content).toBe('edited');
  });

  it('lets the owner rename the document', async () => {
    const service = makeService();
    const updated = await service.update(doc.id, OWNER, { title: 'Renamed' });
    expect(updated.title).toBe('Renamed');
  });

  it('hides the document from users with no access', async () => {
    const service = makeService();
    await expect(service.getIfAccessible(doc.id, STRANGER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
