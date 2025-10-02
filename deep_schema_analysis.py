#!/usr/bin/env python3
"""
Deep Database Schema Analysis for AuZap
Direct PostgreSQL connection for detailed schema information
"""

import psycopg2
from psycopg2 import sql
import json
from datetime import datetime
from urllib.parse import urlparse
from typing import Dict, List, Any

# Parse Supabase connection string
SUPABASE_URL = "https://cdndnwglcieylfgzbwts.supabase.co"
DATABASE_URL = "postgresql://postgres.cdndnwglcieylfgzbwts:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

class DeepSchemaAnalyzer:
    def __init__(self):
        self.report = {
            "timestamp": datetime.now().isoformat(),
            "database": "auzap_supabase",
            "tables": {},
            "columns": {},
            "constraints": {},
            "indexes": {},
            "rls_policies": {},
            "functions": {},
            "triggers": {},
            "views": {},
            "issues": [],
            "optimizations": []
        }

    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            # Try connection with service role
            self.conn = psycopg2.connect(DATABASE_URL)
            self.cursor = self.conn.cursor()
            print("✅ Connected to database successfully")
            return True
        except Exception as e:
            print(f"❌ Connection error: {str(e)}")
            return False

    def analyze(self):
        """Run complete deep analysis"""
        if not self.connect():
            return self.report

        try:
            # 1. Get all tables with details
            self.analyze_tables()

            # 2. Get column details for each table
            self.analyze_columns()

            # 3. Get all constraints
            self.analyze_constraints()

            # 4. Get all indexes
            self.analyze_indexes()

            # 5. Get RLS policies
            self.analyze_rls_policies()

            # 6. Get functions and stored procedures
            self.analyze_functions()

            # 7. Get triggers
            self.analyze_triggers()

            # 8. Get views
            self.analyze_views()

            # 9. Generate recommendations
            self.generate_recommendations()

            # 10. Save report
            self.save_report()

        finally:
            self.cursor.close()
            self.conn.close()

        return self.report

    def analyze_tables(self):
        """Get detailed table information"""
        print("\n📊 Analyzing tables...")

        query = """
        SELECT
            t.table_name,
            t.table_type,
            obj_description(c.oid) as table_comment,
            pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
            pg_size_pretty(pg_table_size(c.oid)) as table_size,
            pg_size_pretty(pg_indexes_size(c.oid)) as indexes_size,
            n_live_tup as row_count,
            n_dead_tup as dead_rows,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name;
        """

        try:
            self.cursor.execute(query)
            tables = self.cursor.fetchall()

            for table in tables:
                table_name = table[0]
                self.report["tables"][table_name] = {
                    "type": table[1],
                    "comment": table[2],
                    "total_size": table[3],
                    "table_size": table[4],
                    "indexes_size": table[5],
                    "row_count": table[6],
                    "dead_rows": table[7],
                    "last_vacuum": str(table[8]) if table[8] else None,
                    "last_analyze": str(table[10]) if table[10] else None
                }

            print(f"  Found {len(self.report['tables'])} tables")

        except Exception as e:
            print(f"  Error analyzing tables: {str(e)}")
            self.report["issues"].append({"type": "table_analysis", "error": str(e)})

    def analyze_columns(self):
        """Get column details for each table"""
        print("\n📋 Analyzing columns...")

        query = """
        SELECT
            c.table_name,
            c.column_name,
            c.ordinal_position,
            c.column_default,
            c.is_nullable,
            c.data_type,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            col_description(pgc.oid, c.ordinal_position) as column_comment
        FROM information_schema.columns c
        JOIN pg_class pgc ON pgc.relname = c.table_name
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position;
        """

        try:
            self.cursor.execute(query)
            columns = self.cursor.fetchall()

            for col in columns:
                table_name = col[0]
                if table_name not in self.report["columns"]:
                    self.report["columns"][table_name] = []

                self.report["columns"][table_name].append({
                    "name": col[1],
                    "position": col[2],
                    "default": col[3],
                    "nullable": col[4],
                    "type": col[5],
                    "max_length": col[6],
                    "precision": col[7],
                    "scale": col[8],
                    "comment": col[9]
                })

            print(f"  Analyzed columns for {len(self.report['columns'])} tables")

        except Exception as e:
            print(f"  Error analyzing columns: {str(e)}")
            self.report["issues"].append({"type": "column_analysis", "error": str(e)})

    def analyze_constraints(self):
        """Get all constraints (PK, FK, UNIQUE, CHECK)"""
        print("\n🔐 Analyzing constraints...")

        query = """
        SELECT
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            cc.check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        LEFT JOIN information_schema.check_constraints cc
            ON cc.constraint_name = tc.constraint_name
            AND cc.constraint_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_type;
        """

        try:
            self.cursor.execute(query)
            constraints = self.cursor.fetchall()

            for const in constraints:
                table_name = const[0]
                if table_name not in self.report["constraints"]:
                    self.report["constraints"][table_name] = []

                self.report["constraints"][table_name].append({
                    "name": const[1],
                    "type": const[2],
                    "column": const[3],
                    "foreign_table": const[4],
                    "foreign_column": const[5],
                    "check_clause": const[6]
                })

            print(f"  Found constraints for {len(self.report['constraints'])} tables")

        except Exception as e:
            print(f"  Error analyzing constraints: {str(e)}")
            self.report["issues"].append({"type": "constraint_analysis", "error": str(e)})

    def analyze_indexes(self):
        """Get all indexes with their details"""
        print("\n🚀 Analyzing indexes...")

        query = """
        SELECT
            schemaname,
            tablename,
            indexname,
            indexdef,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        JOIN pg_indexes ON pg_indexes.indexname = pg_stat_user_indexes.indexname
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
        """

        try:
            self.cursor.execute(query)
            indexes = self.cursor.fetchall()

            for idx in indexes:
                table_name = idx[1]
                if table_name not in self.report["indexes"]:
                    self.report["indexes"][table_name] = []

                self.report["indexes"][table_name].append({
                    "name": idx[2],
                    "definition": idx[3],
                    "scan_count": idx[4],
                    "tuples_read": idx[5],
                    "tuples_fetched": idx[6],
                    "size": idx[7],
                    "usage": "Active" if idx[4] > 0 else "Unused"
                })

            print(f"  Found indexes for {len(self.report['indexes'])} tables")

        except Exception as e:
            print(f"  Error analyzing indexes: {str(e)}")
            self.report["issues"].append({"type": "index_analysis", "error": str(e)})

    def analyze_rls_policies(self):
        """Get Row Level Security policies"""
        print("\n🔒 Analyzing RLS policies...")

        query = """
        SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
        """

        try:
            self.cursor.execute(query)
            policies = self.cursor.fetchall()

            for policy in policies:
                table_name = policy[1]
                if table_name not in self.report["rls_policies"]:
                    self.report["rls_policies"][table_name] = {"enabled": True, "policies": []}

                self.report["rls_policies"][table_name]["policies"].append({
                    "name": policy[2],
                    "permissive": policy[3],
                    "roles": policy[4],
                    "command": policy[5],
                    "using": policy[6],
                    "with_check": policy[7]
                })

            # Check which tables have RLS enabled but no policies
            self.cursor.execute("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                AND tablename NOT IN (
                    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
                )
            """)

            tables_without_rls = self.cursor.fetchall()
            for table in tables_without_rls:
                self.report["rls_policies"][table[0]] = {"enabled": False, "policies": []}

            print(f"  RLS enabled on {len([t for t, p in self.report['rls_policies'].items() if p['enabled']])} tables")

        except Exception as e:
            print(f"  Error analyzing RLS: {str(e)}")
            self.report["issues"].append({"type": "rls_analysis", "error": str(e)})

    def analyze_functions(self):
        """Get user-defined functions"""
        print("\n🔧 Analyzing functions...")

        query = """
        SELECT
            routine_name,
            routine_type,
            data_type,
            external_language,
            routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        ORDER BY routine_name;
        """

        try:
            self.cursor.execute(query)
            functions = self.cursor.fetchall()

            for func in functions:
                self.report["functions"][func[0]] = {
                    "type": func[1],
                    "return_type": func[2],
                    "language": func[3],
                    "definition": func[4][:200] if func[4] else None  # First 200 chars
                }

            print(f"  Found {len(self.report['functions'])} functions")

        except Exception as e:
            print(f"  Error analyzing functions: {str(e)}")
            self.report["issues"].append({"type": "function_analysis", "error": str(e)})

    def analyze_triggers(self):
        """Get database triggers"""
        print("\n⚡ Analyzing triggers...")

        query = """
        SELECT
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement,
            action_orientation,
            action_timing
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
        """

        try:
            self.cursor.execute(query)
            triggers = self.cursor.fetchall()

            for trig in triggers:
                table_name = trig[2]
                if table_name not in self.report["triggers"]:
                    self.report["triggers"][table_name] = []

                self.report["triggers"][table_name].append({
                    "name": trig[0],
                    "event": trig[1],
                    "statement": trig[3],
                    "orientation": trig[4],
                    "timing": trig[5]
                })

            print(f"  Found triggers on {len(self.report['triggers'])} tables")

        except Exception as e:
            print(f"  Error analyzing triggers: {str(e)}")
            self.report["issues"].append({"type": "trigger_analysis", "error": str(e)})

    def analyze_views(self):
        """Get database views"""
        print("\n👁️ Analyzing views...")

        query = """
        SELECT
            table_name,
            view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name;
        """

        try:
            self.cursor.execute(query)
            views = self.cursor.fetchall()

            for view in views:
                self.report["views"][view[0]] = {
                    "definition": view[1][:500] if view[1] else None  # First 500 chars
                }

            print(f"  Found {len(self.report['views'])} views")

        except Exception as e:
            print(f"  Error analyzing views: {str(e)}")
            self.report["issues"].append({"type": "view_analysis", "error": str(e)})

    def generate_recommendations(self):
        """Generate optimization recommendations"""
        print("\n💡 Generating recommendations...")

        # Check for missing indexes on foreign keys
        for table, constraints in self.report.get("constraints", {}).items():
            for const in constraints:
                if const["type"] == "FOREIGN KEY":
                    column = const["column"]
                    # Check if there's an index on this column
                    has_index = False
                    if table in self.report.get("indexes", {}):
                        for idx in self.report["indexes"][table]:
                            if column in idx["definition"]:
                                has_index = True
                                break

                    if not has_index:
                        self.report["optimizations"].append({
                            "type": "missing_index",
                            "priority": "high",
                            "table": table,
                            "column": column,
                            "recommendation": f"Create index on {table}.{column} (foreign key)"
                        })

        # Check for tables without primary keys
        for table in self.report.get("tables", {}):
            has_pk = False
            if table in self.report.get("constraints", {}):
                for const in self.report["constraints"][table]:
                    if const["type"] == "PRIMARY KEY":
                        has_pk = True
                        break

            if not has_pk:
                self.report["issues"].append({
                    "type": "missing_primary_key",
                    "priority": "critical",
                    "table": table,
                    "message": f"Table {table} has no primary key"
                })

        # Check for tables without RLS
        sensitive_tables = [
            "users", "organizations", "contacts", "pets", "bookings",
            "conversations", "messages", "ai_interactions"
        ]

        for table in sensitive_tables:
            if table in self.report.get("rls_policies", {}):
                if not self.report["rls_policies"][table]["enabled"]:
                    self.report["optimizations"].append({
                        "type": "missing_rls",
                        "priority": "critical",
                        "table": table,
                        "recommendation": f"Enable RLS on {table} - contains sensitive data"
                    })

        # Check for unused indexes
        for table, indexes in self.report.get("indexes", {}).items():
            for idx in indexes:
                if idx["usage"] == "Unused" and idx["scan_count"] == 0:
                    self.report["optimizations"].append({
                        "type": "unused_index",
                        "priority": "low",
                        "table": table,
                        "index": idx["name"],
                        "recommendation": f"Consider removing unused index {idx['name']} on {table}"
                    })

        print(f"  Generated {len(self.report['optimizations'])} recommendations")

    def save_report(self):
        """Save detailed report to file"""
        report_path = "/Users/saraiva/final_auzap/deep_schema_analysis_report.json"

        with open(report_path, "w") as f:
            json.dump(self.report, f, indent=2, default=str)

        print(f"\n📄 Detailed report saved to: {report_path}")

    def print_summary(self):
        """Print summary report"""
        print("\n" + "="*70)
        print("📊 DEEP DATABASE SCHEMA ANALYSIS REPORT")
        print("="*70)

        print(f"\n📋 TABLES ({len(self.report['tables'])})")
        for table_name in sorted(self.report["tables"].keys()):
            table = self.report["tables"][table_name]
            print(f"  • {table_name}: {table.get('row_count', 0)} rows, {table.get('total_size', 'N/A')}")

        print(f"\n🔒 RLS STATUS")
        enabled = [t for t, p in self.report["rls_policies"].items() if p["enabled"]]
        disabled = [t for t, p in self.report["rls_policies"].items() if not p["enabled"]]
        print(f"  ✅ Enabled: {', '.join(enabled) if enabled else 'None'}")
        print(f"  ❌ Disabled: {', '.join(disabled) if disabled else 'None'}")

        print(f"\n🚀 INDEXES")
        total_indexes = sum(len(idx) for idx in self.report["indexes"].values())
        unused_indexes = sum(1 for idxs in self.report["indexes"].values()
                           for idx in idxs if idx["usage"] == "Unused")
        print(f"  • Total: {total_indexes}")
        print(f"  • Unused: {unused_indexes}")

        print(f"\n⚠️ ISSUES ({len(self.report['issues'])})")
        for issue in self.report["issues"][:5]:
            print(f"  • [{issue.get('priority', 'info').upper()}] {issue.get('message', issue.get('error', 'Unknown'))}")

        print(f"\n💡 OPTIMIZATIONS ({len(self.report['optimizations'])})")
        for opt in sorted(self.report["optimizations"], key=lambda x: x["priority"])[:5]:
            print(f"  • [{opt['priority'].upper()}] {opt['recommendation']}")

        print("="*70)

def main():
    analyzer = DeepSchemaAnalyzer()
    analyzer.analyze()
    analyzer.print_summary()

if __name__ == "__main__":
    main()