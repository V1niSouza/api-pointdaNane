import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const segredo = config.get<string>('JWT_SECRET');
        if (!segredo) {
          // Sem a chave secreta qualquer um conseguiria forjar um cracha,
          // entao a API se recusa a subir em vez de ficar insegura em silencio.
          throw new Error('JWT_SECRET nao definido no .env — a API nao pode subir sem ele.');
        }
        return {
          secret: segredo,
          signOptions: {
            // A biblioteca so aceita formatos como "7d", "12h", "30m".
            // O TypeScript nao consegue conferir isso vindo do .env, dai o cast.
            expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
              '7d') as `${number}${'d' | 'h' | 'm' | 's'}`,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
