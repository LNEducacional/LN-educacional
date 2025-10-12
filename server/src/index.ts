import { build } from './app';

const app = build();
const PORT = Number(process.env.PORT) || 3333;

const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
