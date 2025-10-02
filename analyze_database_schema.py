#!/usr/bin/env python3
"""
Database Schema Analyzer for AuZap
Validates existing Supabase/PostgreSQL schema against requirements
"""

import os
import json
from typing import Dict, List, Any
from supabase import create_client, Client
from datetime import datetime

# Supabase Configuration
SUPABASE_URL = "https://cdndnwglcieylfgzbwts.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class DatabaseSchemaAnalyzer:
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.analysis_results = {
            "timestamp": datetime.now().isoformat(),
            "tables": {},
            "rls_status": {},
            "indexes": {},
            "foreign_keys": {},
            "issues": [],
            "suggestions": [],
            "summary": {}
        }

        # Required tables by category
        self.required_tables = {
            "core": [
                "organizations",
                "users",
                "organization_settings",
                "whatsapp_instances",
                "services"
            ],
            "business": [
                "contacts",
                "pets",
                "bookings"
            ],
            "whatsapp_ai": [
                "conversations",
                "messages",
                "ai_interactions"
            ],
            "aurora": [
                "authorized_owner_numbers",
                "aurora_proactive_messages",
                "aurora_automations"
            ]
        }

    def analyze(self):
        """Run complete schema analysis"""
        print("🔍 Starting Database Schema Analysis...\n")

        # 1. List all tables
        self.list_tables()

        # 2. Check table structures
        self.analyze_table_structures()

        # 3. Check RLS status
        self.check_rls_policies()

        # 4. Check indexes
        self.check_indexes()

        # 5. Check foreign keys
        self.check_foreign_keys()

        # 6. Validate against requirements
        self.validate_requirements()

        # 7. Generate report
        self.generate_report()

        return self.analysis_results

    def list_tables(self):
        """List all tables in public schema"""
        query = """
        SELECT
            tablename,
            tableowner,
            hasindexes,
            hastriggers
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
        """

        try:
            response = self.client.rpc("get_tables_info", {"sql_query": query}).execute()
            tables = response.data if response.data else []

            if not tables:
                # Try direct query
                response = self.client.table('information_schema.tables').select('*').eq('table_schema', 'public').execute()
                if response.data:
                    tables = [{"tablename": t['table_name']} for t in response.data]

            self.analysis_results["tables"] = {t.get("tablename", t.get("table_name", "unknown")): t for t in tables}
            print(f"✅ Found {len(tables)} tables in database")

        except Exception as e:
            # Fallback: Query using SQL through a custom function or direct table access
            print(f"⚠️ Could not list tables using pg_tables: {str(e)}")
            self.try_alternative_table_listing()

    def try_alternative_table_listing(self):
        """Alternative method to list tables"""
        # Try to query known tables directly
        known_tables = []
        for category, table_list in self.required_tables.items():
            for table_name in table_list:
                try:
                    # Try to query table with limit 0 to check if it exists
                    response = self.client.table(table_name).select("*").limit(0).execute()
                    known_tables.append(table_name)
                    self.analysis_results["tables"][table_name] = {"exists": True}
                except:
                    self.analysis_results["tables"][table_name] = {"exists": False}

        print(f"✅ Found {len(known_tables)} accessible tables")

    def analyze_table_structures(self):
        """Analyze structure of each table"""
        print("\n📊 Analyzing table structures...")

        for table_name in self.analysis_results["tables"]:
            try:
                # Get table structure by querying with limit 0
                response = self.client.table(table_name).select("*").limit(1).execute()

                if response.data and len(response.data) > 0:
                    # Infer columns from sample data
                    sample = response.data[0]
                    columns = list(sample.keys())
                    self.analysis_results["tables"][table_name]["columns"] = columns
                    self.analysis_results["tables"][table_name]["sample_data"] = True
                else:
                    self.analysis_results["tables"][table_name]["columns"] = []
                    self.analysis_results["tables"][table_name]["sample_data"] = False

                print(f"  ✓ {table_name}: {len(self.analysis_results['tables'][table_name].get('columns', []))} columns detected")

            except Exception as e:
                print(f"  ✗ {table_name}: Could not analyze - {str(e)}")
                self.analysis_results["issues"].append({
                    "type": "table_access",
                    "table": table_name,
                    "error": str(e)
                })

    def check_rls_policies(self):
        """Check Row Level Security policies"""
        print("\n🔒 Checking RLS policies...")

        for table_name in self.analysis_results["tables"]:
            try:
                # Check if table has RLS enabled (this would need a custom RPC function)
                # For now, we'll mark as needs checking
                self.analysis_results["rls_status"][table_name] = "needs_manual_check"

            except Exception as e:
                self.analysis_results["rls_status"][table_name] = f"error: {str(e)}"

        # Add suggestion to check RLS manually
        self.analysis_results["suggestions"].append({
            "priority": "high",
            "type": "security",
            "message": "Manually verify RLS policies are enabled for all tables containing user data"
        })

    def check_indexes(self):
        """Check database indexes"""
        print("\n🚀 Checking indexes...")

        # Key tables that should have indexes
        index_requirements = {
            "users": ["organization_id", "email"],
            "contacts": ["organization_id", "phone_number"],
            "messages": ["conversation_id", "created_at"],
            "bookings": ["organization_id", "contact_id", "scheduled_date"],
            "pets": ["owner_contact_id"],
            "conversations": ["contact_id", "organization_id", "status"]
        }

        for table, recommended_columns in index_requirements.items():
            if table in self.analysis_results["tables"]:
                self.analysis_results["indexes"][table] = {
                    "recommended": recommended_columns,
                    "status": "needs_verification"
                }

                self.analysis_results["suggestions"].append({
                    "priority": "medium",
                    "type": "performance",
                    "message": f"Verify indexes on {table} for columns: {', '.join(recommended_columns)}"
                })

    def check_foreign_keys(self):
        """Check foreign key relationships"""
        print("\n🔗 Checking foreign keys...")

        # Expected foreign key relationships
        expected_fks = {
            "users": ["organization_id -> organizations(id)"],
            "whatsapp_instances": ["organization_id -> organizations(id)"],
            "contacts": ["organization_id -> organizations(id)"],
            "pets": ["owner_contact_id -> contacts(id)"],
            "bookings": [
                "organization_id -> organizations(id)",
                "contact_id -> contacts(id)",
                "pet_id -> pets(id)",
                "service_id -> services(id)"
            ],
            "conversations": [
                "contact_id -> contacts(id)",
                "organization_id -> organizations(id)"
            ],
            "messages": [
                "conversation_id -> conversations(id)"
            ],
            "ai_interactions": [
                "message_id -> messages(id)",
                "organization_id -> organizations(id)"
            ]
        }

        for table, fks in expected_fks.items():
            if table in self.analysis_results["tables"]:
                self.analysis_results["foreign_keys"][table] = {
                    "expected": fks,
                    "status": "needs_verification"
                }

    def validate_requirements(self):
        """Validate schema against requirements"""
        print("\n✅ Validating against requirements...")

        missing_tables = []
        existing_tables = []

        for category, required in self.required_tables.items():
            print(f"\n  {category.upper()} Tables:")
            for table in required:
                if table in self.analysis_results["tables"]:
                    if self.analysis_results["tables"][table].get("exists", True):
                        print(f"    ✅ {table}")
                        existing_tables.append(table)
                    else:
                        print(f"    ❌ {table} - NOT FOUND")
                        missing_tables.append(table)
                else:
                    print(f"    ⚠️ {table} - UNCERTAIN")

        self.analysis_results["summary"] = {
            "total_required": sum(len(tables) for tables in self.required_tables.values()),
            "found": len(existing_tables),
            "missing": len(missing_tables),
            "missing_tables": missing_tables
        }

        # Critical issues
        if missing_tables:
            for table in missing_tables:
                self.analysis_results["issues"].append({
                    "type": "missing_table",
                    "priority": "critical",
                    "table": table,
                    "message": f"Required table '{table}' is missing from the schema"
                })

    def generate_report(self):
        """Generate final analysis report"""
        print("\n" + "="*60)
        print("📋 DATABASE SCHEMA ANALYSIS REPORT")
        print("="*60)

        # Summary
        summary = self.analysis_results["summary"]
        print(f"\n📊 SUMMARY:")
        print(f"  • Required Tables: {summary['total_required']}")
        print(f"  • Found: {summary['found']}")
        print(f"  • Missing: {summary['missing']}")

        # Issues
        if self.analysis_results["issues"]:
            print(f"\n❌ CRITICAL ISSUES ({len(self.analysis_results['issues'])}):")
            for issue in self.analysis_results["issues"]:
                if issue.get("priority") == "critical":
                    print(f"  • {issue['message']}")

        # Suggestions
        if self.analysis_results["suggestions"]:
            print(f"\n💡 SUGGESTIONS ({len(self.analysis_results['suggestions'])}):")
            for suggestion in self.analysis_results["suggestions"][:5]:  # Top 5 suggestions
                print(f"  • [{suggestion['priority'].upper()}] {suggestion['message']}")

        # Missing tables detail
        if summary.get("missing_tables"):
            print(f"\n⚠️ MISSING TABLES THAT NEED TO BE CREATED:")
            for table in summary["missing_tables"]:
                print(f"  • {table}")

        # Save detailed report
        report_path = "/Users/saraiva/final_auzap/database_analysis_report.json"
        with open(report_path, "w") as f:
            json.dump(self.analysis_results, f, indent=2, default=str)

        print(f"\n📄 Detailed report saved to: {report_path}")
        print("="*60)

def main():
    analyzer = DatabaseSchemaAnalyzer(supabase)
    results = analyzer.analyze()

    return results

if __name__ == "__main__":
    main()