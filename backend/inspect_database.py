#!/usr/bin/env python3
"""
Database inspection script to see current tables and structure
"""
import asyncio
from sqlalchemy import text, inspect
from database import get_db_session, engine

async def inspect_database():
    """Inspect current database tables and structure"""
    
    print("🔍 Inspecting Database Structure...")
    print("=" * 50)
    
    # Check if database is accessible
    try:
        async with engine.begin() as conn:
            # Get all tables
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = result.fetchall()
            
            print(f"📊 Found {len(tables)} tables in database:")
            print("-" * 30)
            
            if not tables:
                print("❌ No tables found - database appears empty")
                return
            
            for table in tables:
                table_name = table[0]
                print(f"📋 {table_name}")
                
                # Get column info for each table
                col_result = await conn.execute(text(f"""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}' AND table_schema = 'public'
                    ORDER BY ordinal_position;
                """))
                columns = col_result.fetchall()
                
                for col in columns:
                    nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                    default = f" DEFAULT {col[3]}" if col[3] else ""
                    print(f"   └─ {col[0]}: {col[1]} {nullable}{default}")
                
                # Get row count
                count_result = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                row_count = count_result.scalar()
                print(f"   📊 Rows: {row_count}")
                print()
        
        print("=" * 50)
        print("✅ Database inspection complete!")
        
    except Exception as e:
        print(f"❌ Error inspecting database: {e}")

async def check_alembic_status():
    """Check if Alembic is already set up"""
    try:
        async with engine.begin() as conn:
            # Check if alembic_version table exists
            result = await conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'alembic_version'
                );
            """))
            alembic_exists = result.scalar()
            
            if alembic_exists:
                # Get current revision
                rev_result = await conn.execute(text("SELECT version_num FROM alembic_version"))
                current_rev = rev_result.scalar()
                print(f"🔄 Alembic is already set up. Current revision: {current_rev}")
                return True
            else:
                print("🆕 Alembic not yet initialized in database")
                return False
                
    except Exception as e:
        print(f"❌ Error checking Alembic status: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting database inspection...")
    asyncio.run(inspect_database())
    print("\n🔍 Checking Alembic status...")
    asyncio.run(check_alembic_status())