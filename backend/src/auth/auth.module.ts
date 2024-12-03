import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthResolver, AuthService, JwtService, PrismaService]
})
export class AuthModule {}
