import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { origensPermitidas } from './common/cors.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // O limite padrao de corpo e 100 KB, e uma foto nao cabe nisso. O front
  // reduz a imagem antes de mandar, e a API confere de novo em
  // src/common/foto.ts — este limite e so o teto do transporte.
  app.useBodyParser('json', { limit: '2mb' });

  // Confere automaticamente o corpo e os parametros de toda requisicao
  // contra as regras dos DTOs, antes de o codigo rodar.
  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta campos que a rota nao espera receber.
      whitelist: true,
      // Recusa a requisicao se ela mandar campos desconhecidos.
      forbidNonWhitelisted: true,
      // Converte os textos da URL para numero/booleano conforme o DTO pede.
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // O front (Next.js) roda em outra porta, entao precisa de permissao
  // explicita para chamar esta API a partir do navegador.
  app.enableCors({
    origin: origensPermitidas(process.env.CORS_ORIGIN),
  });

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`API do Point da Nane no ar em http://localhost:${port}`);
}
await bootstrap();
