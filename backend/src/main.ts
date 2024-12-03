import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3001', 'http://0.0.0.127:3001'],
    credentials: true,

    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'apollo-require-preflight',
    ],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  });
  app.use(cookieParser());
  app.use(graphqlUploadExpress({ maxFileSize: 1000000000, maxFiles: 1 }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (error) => {
        const formatedErrors = error.reduce((acc, err) => {
          acc[err.property] = Object.values(err.constraints).join(', ');
          return acc;
        }, {});

        throw new BadRequestException(formatedErrors);
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
