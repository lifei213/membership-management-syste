import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 创建Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 解析请求路径 - 适配前端API调用路径
    const url = new URL(req.url)
    // 对于Supabase Edge Functions，完整路径是 /functions/v1/[function-name]/[path]
    // 我们需要获取function-name之后的路径部分
    const pathname = url.pathname.replace(/^\/functions\/v1\/api\//, '')

    // 根据路径路由到不同的处理函数
    switch (pathname) {
      case 'auth/login':
        return await handleLogin(req, supabaseClient)
      case 'auth/register':
        return await handleRegister(req, supabaseClient)
      case 'members':
        return await handleMembers(req, supabaseClient)
      case 'members/messages':
        return await handleMemberMessages(req, supabaseClient)
      case 'members/message-to-admin':
        return await handleSendMessageToAdmin(req, supabaseClient)
      case 'health':
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      default:
        return new Response(JSON.stringify({ error: 'Route not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// 登录处理函数
async function handleLogin(req: Request, supabaseClient: any): Promise<Response> {
  const { username, password } = await req.json()
  
  try {
    // 在数据库中查找用户
    const { data: users, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) {
      throw new Error('用户不存在')
    }
    
    if (!users) {
      return new Response(JSON.stringify({ 
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // 简单的密码比较（实际应用中应该使用bcrypt等安全哈希算法）
    if (users.password !== password) {
      return new Response(JSON.stringify({ 
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // 生成简单的JWT令牌（实际应用中应该使用安全的JWT库）
    const token = 'mock-jwt-token-' + Date.now()
    
    // 返回用户信息和令牌
    return new Response(JSON.stringify({ 
      message: '登录成功',
      token,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        is_active: users.is_active
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '登录失败'
    return new Response(JSON.stringify({ 
      message: errorMessage,
      code: 'LOGIN_FAILED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// 注册处理函数
async function handleRegister(req: Request, supabaseClient: any): Promise<Response> {
  const { username, email, password } = await req.json()
  
  // 这里需要实现注册逻辑
  // 暂时返回模拟响应
  return new Response(JSON.stringify({ 
    message: 'Register endpoint - to be implemented',
    username,
    email
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// 会员管理处理函数
async function handleMembers(req: Request, supabaseClient: any): Promise<Response> {
  // 这里需要实现会员管理逻辑
  return new Response(JSON.stringify({ 
    message: 'Members endpoint - to be implemented'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// 会员消息处理函数
async function handleMemberMessages(req: Request, supabaseClient: any): Promise<Response> {
  // 这里需要实现会员消息逻辑
  return new Response(JSON.stringify({ 
    message: 'Member messages endpoint - to be implemented'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// 发送消息给管理员处理函数
async function handleSendMessageToAdmin(req: Request, supabaseClient: any): Promise<Response> {
  const { subject, content } = await req.json()
  
  // 这里需要实现发送消息逻辑
  return new Response(JSON.stringify({ 
    message: 'Message sent to admin - to be implemented',
    subject,
    content
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}