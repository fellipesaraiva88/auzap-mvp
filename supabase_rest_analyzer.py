#!/usr/bin/env python3
"""
Supabase REST API Schema Analyzer for AuZap
Comprehensive database analysis using Supabase REST endpoints
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Any

# Supabase Configuration
SUPABASE_URL = "https://cdndnwglcieylfgzbwts.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU1NzMsImV4cCI6MjA3NDk0MTU3M30.BwvlhpRijTbdofpU06mH84-SjOWH9GFr9tzEpuN1DUM"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmRud2dsY2lleWxmZ3pid3RzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM2NTU3MywiZXhwIjoyMDc0OTQxNTczfQ.-38opT8Tw9f59tUbEvxNrdEOb3tPXZSx0bePm3wtcMg"

class SupabaseSchemaAnalyzer:
    def __init__(self):
        self.headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        self.base_url = f"{SUPABASE_URL}/rest/v1"

        self.report = {
            "timestamp": datetime.now().isoformat(),
            "database": "AuZap Supabase",
            "tables_found": [],
            "tables_missing": [],
            "table_analysis": {},
            "rls_recommendations": [],
            "index_recommendations": [],
            "issues": [],
            "optimizations": []
        }

        # Required tables grouped by category
        self.required_tables = {
            "Core Infrastructure": [
                "organizations",
                "users",
                "organization_settings",
                "whatsapp_instances",
                "services"
            ],
            "Business Domain": [
                "contacts",
                "pets",
                "bookings"
            ],
            "WhatsApp & AI": [
                "conversations",
                "messages",
                "ai_interactions"
            ],
            "Aurora Features": [
                "authorized_owner_numbers",
                "aurora_proactive_messages",
                "aurora_automations"
            ]
        }

    def check_table_exists(self, table_name: str) -> Dict:
        """Check if a table exists and get its structure"""
        try:
            # Try to query the table with limit 1
            response = requests.get(
                f"{self.base_url}/{table_name}",
                headers=self.headers,
                params={"limit": 1}
            )

            if response.status_code == 200:
                data = response.json()

                # Get row count
                count_response = requests.head(
                    f"{self.base_url}/{table_name}",
                    headers={**self.headers, "Prefer": "count=exact"}
                )

                row_count = 0
                if count_response.status_code == 200:
                    content_range = count_response.headers.get('content-range', '')
                    if content_range:
                        # Parse "0-0/123" to get total count
                        parts = content_range.split('/')
                        if len(parts) == 2:
                            row_count = int(parts[1]) if parts[1] != '*' else 0

                # Infer columns from sample data
                columns = []
                column_types = {}
                if data and len(data) > 0:
                    sample = data[0]
                    for key, value in sample.items():
                        columns.append(key)
                        # Infer type from value
                        if value is None:
                            column_types[key] = "unknown"
                        elif isinstance(value, bool):
                            column_types[key] = "boolean"
                        elif isinstance(value, int):
                            column_types[key] = "integer"
                        elif isinstance(value, float):
                            column_types[key] = "numeric"
                        elif isinstance(value, str):
                            if 'id' in key.lower():
                                column_types[key] = "uuid"
                            elif 'date' in key.lower() or 'time' in key.lower() or '_at' in key:
                                column_types[key] = "timestamp"
                            else:
                                column_types[key] = "text"
                        elif isinstance(value, dict):
                            column_types[key] = "jsonb"
                        elif isinstance(value, list):
                            column_types[key] = "array"
                        else:
                            column_types[key] = type(value).__name__

                return {
                    "exists": True,
                    "accessible": True,
                    "row_count": row_count,
                    "columns": columns,
                    "column_types": column_types,
                    "sample_data": data[0] if data else None
                }

            elif response.status_code == 404:
                return {
                    "exists": False,
                    "accessible": False,
                    "error": "Table not found"
                }
            else:
                return {
                    "exists": "unknown",
                    "accessible": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }

        except Exception as e:
            return {
                "exists": "unknown",
                "accessible": False,
                "error": str(e)
            }

    def analyze_table_relationships(self, table_name: str, columns: List[str]) -> Dict:
        """Analyze potential foreign key relationships"""
        relationships = {
            "foreign_keys": [],
            "referenced_by": []
        }

        # Common foreign key patterns
        fk_patterns = {
            "organization_id": "organizations",
            "user_id": "users",
            "contact_id": "contacts",
            "pet_id": "pets",
            "service_id": "services",
            "booking_id": "bookings",
            "conversation_id": "conversations",
            "message_id": "messages",
            "owner_contact_id": "contacts",
            "whatsapp_instance_id": "whatsapp_instances"
        }

        for column in columns:
            if column in fk_patterns:
                relationships["foreign_keys"].append({
                    "column": column,
                    "references": fk_patterns[column],
                    "type": "inferred"
                })

        return relationships

    def analyze_indexes_needed(self, table_name: str, columns: List[str]) -> List[Dict]:
        """Recommend indexes based on common patterns"""
        recommendations = []

        # Common patterns that need indexes
        index_patterns = {
            "foreign_keys": ["_id"],
            "timestamps": ["created_at", "updated_at", "scheduled_date", "booking_date"],
            "status_fields": ["status", "state", "is_active", "is_deleted"],
            "search_fields": ["email", "phone", "phone_number", "name", "username"],
            "sorting_fields": ["priority", "sort_order", "sequence"]
        }

        for column in columns:
            # Foreign keys should have indexes
            if column.endswith("_id"):
                recommendations.append({
                    "column": column,
                    "type": "btree",
                    "reason": "Foreign key - improves JOIN performance"
                })

            # Timestamp fields for sorting/filtering
            elif any(pattern in column for pattern in index_patterns["timestamps"]):
                recommendations.append({
                    "column": column,
                    "type": "btree",
                    "reason": "Temporal queries and sorting"
                })

            # Status fields for filtering
            elif column in index_patterns["status_fields"]:
                recommendations.append({
                    "column": column,
                    "type": "btree",
                    "reason": "Frequent filtering on status"
                })

            # Search fields
            elif column in index_patterns["search_fields"]:
                recommendations.append({
                    "column": column,
                    "type": "btree",
                    "reason": "Search and unique lookups"
                })

        # Composite index recommendations
        if table_name == "messages":
            recommendations.append({
                "columns": ["conversation_id", "created_at"],
                "type": "composite",
                "reason": "Message history queries"
            })
        elif table_name == "bookings":
            recommendations.append({
                "columns": ["organization_id", "scheduled_date"],
                "type": "composite",
                "reason": "Calendar view queries"
            })
        elif table_name == "contacts":
            recommendations.append({
                "columns": ["organization_id", "phone_number"],
                "type": "composite",
                "reason": "Contact lookup by organization"
            })

        return recommendations

    def analyze_rls_requirements(self, table_name: str) -> Dict:
        """Determine RLS requirements for table"""
        # Tables that contain user/org data should have RLS
        rls_required_tables = {
            "high_priority": [
                "users", "organizations", "organization_settings",
                "contacts", "pets", "bookings",
                "conversations", "messages", "ai_interactions",
                "whatsapp_instances"
            ],
            "medium_priority": [
                "services", "authorized_owner_numbers",
                "aurora_proactive_messages", "aurora_automations"
            ]
        }

        if table_name in rls_required_tables["high_priority"]:
            return {
                "required": True,
                "priority": "high",
                "reason": "Contains sensitive user/organization data",
                "suggested_policies": [
                    f"SELECT: Users can only see their organization's {table_name}",
                    f"INSERT: Users can only insert for their organization",
                    f"UPDATE: Users can only update their organization's records",
                    f"DELETE: Users can only delete their organization's records"
                ]
            }
        elif table_name in rls_required_tables["medium_priority"]:
            return {
                "required": True,
                "priority": "medium",
                "reason": "Contains organization-specific configuration",
                "suggested_policies": [
                    f"SELECT: Restricted to organization members",
                    f"UPDATE: Restricted to organization admins"
                ]
            }
        else:
            return {
                "required": False,
                "priority": "low",
                "reason": "Public or system table"
            }

    def run_analysis(self):
        """Run complete schema analysis"""
        print("\n" + "="*70)
        print("🔍 SUPABASE DATABASE SCHEMA ANALYSIS")
        print("="*70)
        print(f"📅 Analysis Date: {self.report['timestamp']}")
        print(f"🔗 Database: {SUPABASE_URL}")
        print("="*70)

        all_tables = []
        for category, tables in self.required_tables.items():
            all_tables.extend(tables)

        # Analyze each required table
        for category, tables in self.required_tables.items():
            print(f"\n📂 {category}")
            print("-" * 50)

            for table_name in tables:
                print(f"\n  🔍 Analyzing: {table_name}")

                # Check if table exists
                table_info = self.check_table_exists(table_name)

                if table_info["exists"]:
                    self.report["tables_found"].append(table_name)
                    print(f"    ✅ EXISTS - {table_info['row_count']} rows")

                    # Store detailed analysis
                    self.report["table_analysis"][table_name] = {
                        "status": "exists",
                        "row_count": table_info["row_count"],
                        "columns": table_info["columns"],
                        "column_types": table_info["column_types"],
                        "column_count": len(table_info["columns"])
                    }

                    # Analyze columns
                    if table_info["columns"]:
                        print(f"    📋 Columns ({len(table_info['columns'])}): {', '.join(table_info['columns'][:5])}" +
                              ("..." if len(table_info["columns"]) > 5 else ""))

                        # Analyze relationships
                        relationships = self.analyze_table_relationships(table_name, table_info["columns"])
                        self.report["table_analysis"][table_name]["relationships"] = relationships

                        if relationships["foreign_keys"]:
                            print(f"    🔗 Foreign Keys: {', '.join([fk['column'] for fk in relationships['foreign_keys']])}")

                        # Analyze index needs
                        index_recommendations = self.analyze_indexes_needed(table_name, table_info["columns"])
                        if index_recommendations:
                            self.report["index_recommendations"].append({
                                "table": table_name,
                                "recommendations": index_recommendations
                            })
                            print(f"    🚀 Recommended Indexes: {len(index_recommendations)}")

                    # Analyze RLS requirements
                    rls_req = self.analyze_rls_requirements(table_name)
                    if rls_req["required"]:
                        self.report["rls_recommendations"].append({
                            "table": table_name,
                            "priority": rls_req["priority"],
                            "reason": rls_req["reason"],
                            "policies": rls_req["suggested_policies"]
                        })
                        print(f"    🔒 RLS Priority: {rls_req['priority'].upper()}")

                elif table_info["exists"] == False:
                    self.report["tables_missing"].append(table_name)
                    print(f"    ❌ MISSING - Table does not exist")

                    self.report["issues"].append({
                        "type": "missing_table",
                        "priority": "critical",
                        "table": table_name,
                        "message": f"Required table '{table_name}' is missing"
                    })
                else:
                    print(f"    ⚠️ UNCERTAIN - {table_info.get('error', 'Unknown error')}")

                    self.report["issues"].append({
                        "type": "access_error",
                        "priority": "high",
                        "table": table_name,
                        "message": table_info.get("error", "Could not access table")
                    })

        # Generate optimizations
        self.generate_optimizations()

        # Print summary
        self.print_summary()

        # Save detailed report
        self.save_report()

        return self.report

    def generate_optimizations(self):
        """Generate optimization recommendations"""

        # Check for missing critical tables
        critical_tables = ["organizations", "users", "contacts", "whatsapp_instances"]
        for table in critical_tables:
            if table in self.report["tables_missing"]:
                self.report["optimizations"].append({
                    "type": "create_table",
                    "priority": "critical",
                    "action": f"CREATE TABLE {table}",
                    "reason": f"Core table '{table}' is required for application to function"
                })

        # Index optimization
        for idx_rec in self.report["index_recommendations"]:
            if len(idx_rec["recommendations"]) > 3:
                self.report["optimizations"].append({
                    "type": "index_creation",
                    "priority": "high",
                    "action": f"Create {len(idx_rec['recommendations'])} indexes on {idx_rec['table']}",
                    "reason": "Multiple columns need indexing for performance"
                })

        # RLS optimization
        high_priority_rls = [r for r in self.report["rls_recommendations"] if r["priority"] == "high"]
        if high_priority_rls:
            self.report["optimizations"].append({
                "type": "security",
                "priority": "critical",
                "action": f"Enable RLS on {len(high_priority_rls)} sensitive tables",
                "reason": "Protect user data with Row Level Security"
            })

    def print_summary(self):
        """Print analysis summary"""
        print("\n" + "="*70)
        print("📊 ANALYSIS SUMMARY")
        print("="*70)

        total_required = sum(len(tables) for tables in self.required_tables.values())

        print(f"\n✅ Tables Found: {len(self.report['tables_found'])}/{total_required}")
        if self.report["tables_found"]:
            for table in sorted(self.report["tables_found"]):
                info = self.report["table_analysis"].get(table, {})
                print(f"   • {table}: {info.get('row_count', 0)} rows, {info.get('column_count', 0)} columns")

        if self.report["tables_missing"]:
            print(f"\n❌ Missing Tables: {len(self.report['tables_missing'])}")
            for table in self.report["tables_missing"]:
                print(f"   • {table}")

        if self.report["issues"]:
            print(f"\n⚠️ Issues Found: {len(self.report['issues'])}")
            critical_issues = [i for i in self.report["issues"] if i["priority"] == "critical"]
            if critical_issues:
                print("   Critical Issues:")
                for issue in critical_issues[:5]:
                    print(f"   • {issue['message']}")

        if self.report["rls_recommendations"]:
            print(f"\n🔒 RLS Recommendations: {len(self.report['rls_recommendations'])} tables need RLS")
            high_priority = [r for r in self.report["rls_recommendations"] if r["priority"] == "high"]
            if high_priority:
                print("   High Priority:")
                for rec in high_priority[:5]:
                    print(f"   • {rec['table']}: {rec['reason']}")

        if self.report["index_recommendations"]:
            total_indexes = sum(len(r["recommendations"]) for r in self.report["index_recommendations"])
            print(f"\n🚀 Index Recommendations: {total_indexes} indexes across {len(self.report['index_recommendations'])} tables")

        if self.report["optimizations"]:
            print(f"\n💡 Optimizations: {len(self.report['optimizations'])}")
            for opt in sorted(self.report["optimizations"], key=lambda x: x["priority"])[:5]:
                print(f"   [{opt['priority'].upper()}] {opt['action']}")
                print(f"         → {opt['reason']}")

        print("\n" + "="*70)

    def save_report(self):
        """Save detailed report to file"""
        report_path = "/Users/saraiva/final_auzap/supabase_schema_analysis.json"

        with open(report_path, "w") as f:
            json.dump(self.report, f, indent=2, default=str)

        print(f"\n📄 Detailed report saved to: {report_path}")

        # Also save a markdown report
        self.save_markdown_report()

    def save_markdown_report(self):
        """Generate and save a markdown report"""
        md_path = "/Users/saraiva/final_auzap/DATABASE_SCHEMA_REPORT.md"

        with open(md_path, "w") as f:
            f.write("# AuZap Database Schema Analysis Report\n\n")
            f.write(f"**Analysis Date:** {self.report['timestamp']}\n")
            f.write(f"**Database:** {SUPABASE_URL}\n\n")

            # Executive Summary
            f.write("## Executive Summary\n\n")
            total_required = sum(len(tables) for tables in self.required_tables.values())
            f.write(f"- **Required Tables:** {total_required}\n")
            f.write(f"- **Found:** {len(self.report['tables_found'])}\n")
            f.write(f"- **Missing:** {len(self.report['tables_missing'])}\n")
            f.write(f"- **Critical Issues:** {len([i for i in self.report['issues'] if i['priority'] == 'critical'])}\n\n")

            # Table Status
            f.write("## Table Status\n\n")

            for category, tables in self.required_tables.items():
                f.write(f"### {category}\n\n")
                f.write("| Table | Status | Rows | Columns | Notes |\n")
                f.write("|-------|--------|------|---------|-------|\n")

                for table in tables:
                    if table in self.report["tables_found"]:
                        info = self.report["table_analysis"].get(table, {})
                        f.write(f"| {table} | ✅ Exists | {info.get('row_count', 0)} | {info.get('column_count', 0)} | - |\n")
                    elif table in self.report["tables_missing"]:
                        f.write(f"| {table} | ❌ Missing | - | - | Needs to be created |\n")
                    else:
                        f.write(f"| {table} | ⚠️ Unknown | - | - | Access error |\n")

                f.write("\n")

            # Critical Issues
            if self.report["issues"]:
                f.write("## Critical Issues\n\n")
                critical_issues = [i for i in self.report["issues"] if i["priority"] == "critical"]
                if critical_issues:
                    for issue in critical_issues:
                        f.write(f"- **{issue['table']}:** {issue['message']}\n")
                    f.write("\n")

            # Recommendations
            f.write("## Recommendations\n\n")

            # RLS
            if self.report["rls_recommendations"]:
                f.write("### Row Level Security\n\n")
                f.write("Tables requiring RLS implementation:\n\n")
                for rec in sorted(self.report["rls_recommendations"], key=lambda x: x["priority"]):
                    f.write(f"- **{rec['table']}** ({rec['priority']} priority): {rec['reason']}\n")
                f.write("\n")

            # Indexes
            if self.report["index_recommendations"]:
                f.write("### Index Optimization\n\n")
                f.write("Tables requiring indexes:\n\n")
                for idx_rec in self.report["index_recommendations"]:
                    f.write(f"- **{idx_rec['table']}**: {len(idx_rec['recommendations'])} indexes recommended\n")
                f.write("\n")

            # Action Items
            if self.report["optimizations"]:
                f.write("## Action Items\n\n")
                f.write("Priority actions for database optimization:\n\n")

                critical = [o for o in self.report["optimizations"] if o["priority"] == "critical"]
                high = [o for o in self.report["optimizations"] if o["priority"] == "high"]

                if critical:
                    f.write("### Critical Priority\n\n")
                    for opt in critical:
                        f.write(f"1. **{opt['action']}**\n")
                        f.write(f"   - Reason: {opt['reason']}\n\n")

                if high:
                    f.write("### High Priority\n\n")
                    for opt in high:
                        f.write(f"1. **{opt['action']}**\n")
                        f.write(f"   - Reason: {opt['reason']}\n\n")

        print(f"📝 Markdown report saved to: {md_path}")

def main():
    analyzer = SupabaseSchemaAnalyzer()
    analyzer.run_analysis()

if __name__ == "__main__":
    main()