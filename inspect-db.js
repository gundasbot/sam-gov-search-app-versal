const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Inspecting database schema...\n')
  
  // Check admin_users columns
  const adminUsers = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'admin_users'
    ORDER BY ordinal_position
  `
  
  console.log('📋 admin_users columns:')
  adminUsers.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
  })
  
  // Check audit_logs columns
  const auditLogs = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    ORDER BY ordinal_position
  `
  
  console.log('\n📋 audit_logs columns:')
  auditLogs.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
  })
  
  // Check users columns
  const users = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `
  
  console.log('\n📋 users columns:')
  users.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
  })
  
  // Check enums
  const enums = await prisma.$queryRaw`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  `
  
  console.log('\n📋 Enums:')
  const enumMap = {}
  enums.forEach(e => {
    if (!enumMap[e.enum_name]) enumMap[e.enum_name] = []
    enumMap[e.enum_name].push(e.enum_value)
  })
  Object.entries(enumMap).forEach(([name, values]) => {
    console.log(`  - ${name}: [${values.join(', ')}]`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())