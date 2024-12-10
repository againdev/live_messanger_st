import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { LiveChatroomResolver } from './live-chatroom.resolver';
import { LiveChatroomService } from './live-chatroom.service';

@Module({
  providers: [
    LiveChatroomResolver,
    LiveChatroomService,
    UserService,
    PrismaService,
    JwtService,
  ],
})
export class LiveChatroomModule {}
