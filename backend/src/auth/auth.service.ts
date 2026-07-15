import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

export type AuthUser = { id: number; name: string; email: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authUser: AuthUser = { id: user.id, name: user.name, email: user.email };
    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
    return { access_token, user: authUser };
  }
}
