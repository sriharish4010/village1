import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/prisma.js';

async function bootstrap() {
  try {
    await connectDatabase();
    app.listen(env.PORT, () => {
      console.log(`=================================================`);
      console.log(`  🌾 Village1 Backend API Server Running`);
      console.log(`  - Environment: ${env.NODE_ENV}`);
      console.log(`  - Port:        ${env.PORT}`);
      console.log(`  - API Root:    http://localhost:${env.PORT}${env.API_PREFIX}`);
      console.log(`  - Swagger UI:  http://localhost:${env.PORT}/api-docs`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
