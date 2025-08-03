// types/express/index.d.ts

import { User as SupabaseUser } from "@supabase/auth-js";

declare namespace Express {
  export interface User extends SupabaseUser {}

  export interface Request {
    user?: SupabaseUser;
  }
}
