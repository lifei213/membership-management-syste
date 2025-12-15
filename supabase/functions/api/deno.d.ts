// Deno环境类型声明
/// <reference types="https://deno.land/x/types@0.0.1/types.d.ts" />

declare module "https://deno.land/std@0.177.0/http/server.ts" {
  export function serve(handler: (request: Request) => Promise<Response> | Response): void;
  export function serve(addr: string | Deno.ListenOptions, handler: (request: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}

declare module "https://deno.land/x/bcrypt@v0.4.1/mod.ts" {
  export function hash(password: string): Promise<string>;
  export function compare(password: string, hash: string): Promise<boolean>;
}

declare module "https://deno.land/x/jwt@v2.8/mod.ts" {
  export function create(header: any, payload: any, key: string): Promise<string>;
  export function verify(token: string, key: string): Promise<any>;
}

// Deno全局对象声明
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  
  const env: Env;
}