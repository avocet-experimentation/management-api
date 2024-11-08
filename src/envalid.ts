import 'dotenv/config';
import { cleanEnv, num, str } from "envalid";

const env = cleanEnv(process.env, {
  MONGO_DATABASE: str(),
  MONGO_ADMIN_URI: str(),
  MONGO_API_URI: str(),
  MONGO_TESTING_DATABASE: str(),
  MONGO_TESTING_URI: str(),
  SERVICE_PORT: num(),
});

export default env;