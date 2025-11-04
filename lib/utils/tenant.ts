/**
 * Tenant/Workspace Utilities
 * Helper functions for multi-tenant operations
 */

import { prisma } from '@/lib/db/prisma'
import { TenantRole } from '@prisma/client'

/**
 * Get user's tenants/workspaces
 */
export async function getUserTenants(userId: string) {
  return prisma.tenantUser.findMany({
    where: { userId },
    include: {
      tenant: true,
    },
  })
}

/**
 * Get tenant by ID with user membership
 */
export async function getTenantWithUser(tenantId: string, userId: string) {
  return prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    include: {
      tenant: true,
    },
  })
}

/**
 * Check if user has permission in tenant
 */
export async function hasTenantPermission(
  userId: string,
  tenantId: string,
  requiredRole: TenantRole = TenantRole.MEMBER
) {
  const membership = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  })

  if (!membership) return false

  const roleHierarchy = {
    [TenantRole.MEMBER]: 0,
    [TenantRole.ADMIN]: 1,
    [TenantRole.OWNER]: 2,
  }

  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole]
}

/**
 * Create a new workspace/tenant
 */
export async function createTenant(
  name: string,
  ownerId: string,
  slug?: string
) {
  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-')

  // Check if slug exists
  const existing = await prisma.tenant.findUnique({
    where: { slug: finalSlug },
  })

  if (existing) {
    throw new Error('Workspace slug already exists')
  }

  return prisma.tenant.create({
    data: {
      name,
      slug: finalSlug,
      users: {
        create: {
          userId: ownerId,
          role: TenantRole.OWNER,
        },
      },
    },
  })
}

