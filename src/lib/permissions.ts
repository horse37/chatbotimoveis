// Sistema de permissões para a área administrativa

export enum Permission {
  // Imóveis
  IMOVEIS_VIEW = 'imoveis:view',
  IMOVEIS_CREATE = 'imoveis:create',
  IMOVEIS_EDIT = 'imoveis:edit',
  IMOVEIS_DELETE = 'imoveis:delete',
  
  // Corretores
  CORRETORES_VIEW = 'corretores:view',
  CORRETORES_CREATE = 'corretores:create',
  CORRETORES_EDIT = 'corretores:edit',
  CORRETORES_DELETE = 'corretores:delete',
  
  // Contatos
  CONTATOS_VIEW = 'contatos:view',
  CONTATOS_EDIT = 'contatos:edit',
  CONTATOS_DELETE = 'contatos:delete',
  
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  
  // Administração
  ADMIN_FULL = 'admin:full'
}

export enum Role {
  ADMIN = 'admin',
  CORRETOR = 'corretor',
  GERENTE = 'gerente'
}

// Mapeamento de permissões por role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.ADMIN_FULL,
    Permission.DASHBOARD_VIEW,
    Permission.IMOVEIS_VIEW,
    Permission.IMOVEIS_CREATE,
    Permission.IMOVEIS_EDIT,
    Permission.IMOVEIS_DELETE,
    Permission.CORRETORES_VIEW,
    Permission.CORRETORES_CREATE,
    Permission.CORRETORES_EDIT,
    Permission.CORRETORES_DELETE,
    Permission.CONTATOS_VIEW,
    Permission.CONTATOS_EDIT,
    Permission.CONTATOS_DELETE
  ],
  [Role.GERENTE]: [
    Permission.DASHBOARD_VIEW,
    Permission.IMOVEIS_VIEW,
    Permission.IMOVEIS_CREATE,
    Permission.IMOVEIS_EDIT,
    Permission.CORRETORES_VIEW,
    Permission.CONTATOS_VIEW,
    Permission.CONTATOS_EDIT
  ],
  [Role.CORRETOR]: [
    Permission.IMOVEIS_VIEW,
    Permission.IMOVEIS_CREATE,
    Permission.IMOVEIS_EDIT,
    Permission.CONTATOS_VIEW
  ]
}

// Função para verificar se um usuário tem uma permissão específica
export function hasPermission(userRole: string, permission: Permission): boolean {
  const role = userRole as Role
  const permissions = ROLE_PERMISSIONS[role] || []
  
  // Admin tem acesso total
  if (permissions.includes(Permission.ADMIN_FULL)) {
    return true
  }
  
  return permissions.includes(permission)
}

// Função para verificar múltiplas permissões
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Função para verificar se tem todas as permissões
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Middleware para verificar permissões em rotas da API
export function requirePermission(permission: Permission) {
  return (userRole: string) => {
    if (!hasPermission(userRole, permission)) {
      throw new Error('Acesso negado: permissão insuficiente')
    }
  }
}

// Hook para usar no frontend (React)
export function usePermissions(userRole: string) {
  return {
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    canViewDashboard: () => hasPermission(userRole, Permission.DASHBOARD_VIEW),
    canManageImoveis: () => hasAnyPermission(userRole, [
      Permission.IMOVEIS_CREATE,
      Permission.IMOVEIS_EDIT,
      Permission.IMOVEIS_DELETE
    ]),
    canManageCorretores: () => hasAnyPermission(userRole, [
      Permission.CORRETORES_CREATE,
      Permission.CORRETORES_EDIT,
      Permission.CORRETORES_DELETE
    ]),
    canManageContatos: () => hasAnyPermission(userRole, [
      Permission.CONTATOS_EDIT,
      Permission.CONTATOS_DELETE
    ]),
    isAdmin: () => hasPermission(userRole, Permission.ADMIN_FULL)
  }
}

// Função para filtrar itens de menu baseado nas permissões
export function getMenuItems(userRole: string) {
  const menuItems = []
  
  if (hasPermission(userRole, Permission.DASHBOARD_VIEW)) {
    menuItems.push({
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'dashboard'
    })
  }
  
  if (hasPermission(userRole, Permission.IMOVEIS_VIEW)) {
    const canManageImoveis = hasAnyPermission(userRole, [Permission.IMOVEIS_CREATE, Permission.IMOVEIS_EDIT])
    menuItems.push({
      name: 'Imóveis',
      href: '/admin/imoveis',
      icon: 'home',
      submenu: canManageImoveis ? [
        { name: 'Listar', href: '/admin/imoveis' },
        { name: 'Novo', href: '/admin/imoveis/novo' }
      ] : undefined
    })
  }
  
  if (hasPermission(userRole, Permission.CORRETORES_VIEW)) {
    const canManageCorretores = hasAnyPermission(userRole, [Permission.CORRETORES_CREATE, Permission.CORRETORES_EDIT])
    menuItems.push({
      name: 'Corretores',
      href: '/admin/corretores',
      icon: 'users',
      submenu: canManageCorretores ? [
        { name: 'Listar', href: '/admin/corretores' },
        { name: 'Novo', href: '/admin/corretores/novo' }
      ] : undefined
    })
  }
  
  if (hasPermission(userRole, Permission.CONTATOS_VIEW)) {
    const canManageContatos = hasAnyPermission(userRole, [Permission.CONTATOS_EDIT, Permission.CONTATOS_DELETE])
    menuItems.push({
      name: 'Contatos',
      href: '/admin/contatos',
      icon: 'message',
      submenu: canManageContatos ? [
        { name: 'Listar', href: '/admin/contatos' },
        { name: 'Novo', href: '/admin/contatos/novo' }
      ] : undefined
    })
  }
  
  // Backup de Mídias - apenas para administradores
  if (hasPermission(userRole, Permission.ADMIN_FULL)) {
    menuItems.push({
      name: 'Backup de Mídias',
      href: '/admin/backup-medias',
      icon: 'database'
    })
  }
  
  return menuItems
}