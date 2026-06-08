import requests
import sys
import json
from datetime import datetime

class HRlyticAPITester:
    def __init__(self, base_url="https://workforce-insights-15.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    "name": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "name": name,
                "endpoint": endpoint,
                "expected": expected_status,
                "actual": "Exception",
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_years_endpoint(self):
        """Test years endpoint"""
        return self.run_test("Get Years", "GET", "dashboard/years", 200)

    def test_overview_endpoint(self):
        """Test overview dashboard endpoint"""
        success, data = self.run_test("Overview Dashboard", "GET", "dashboard/overview?year=2025", 200)
        if success and data:
            # Validate structure
            required_keys = ['kpis', 'gender_distribution', 'age_distribution', 'headcount_by_month']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in overview response: {missing_keys}")
            else:
                print(f"✅ Overview data structure valid")
        return success, data

    def test_headcount_endpoint(self):
        """Test headcount dashboard endpoint"""
        success, data = self.run_test("Headcount Dashboard", "GET", "dashboard/headcount?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'department_distribution', 'employee_list']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in headcount response: {missing_keys}")
            else:
                print(f"✅ Headcount data structure valid")
        return success, data

    def test_hires_endpoint(self):
        """Test hires dashboard endpoint"""
        return self.run_test("Hires Dashboard", "GET", "dashboard/hires?year=2025", 200)

    def test_leaves_endpoint(self):
        """Test leaves dashboard endpoint"""
        return self.run_test("Leaves Dashboard", "GET", "dashboard/leaves?year=2025", 200)

    def test_turnover_endpoint(self):
        """Test turnover dashboard endpoint"""
        return self.run_test("Turnover Dashboard", "GET", "dashboard/turnover?year=2025", 200)

    def test_movement_endpoint(self):
        """Test movement dashboard endpoint"""
        return self.run_test("Movement Dashboard", "GET", "dashboard/movement?year=2025", 200)

    def test_ai_forecast_endpoint(self):
        """Test AI forecast endpoint"""
        success, data = self.run_test("AI Forecast", "POST", "ai/forecast", 200, {"year": 2025})
        if success and data:
            required_keys = ['attrition_risk', 'headcount_forecast', 'department_risks']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in AI forecast response: {missing_keys}")
            else:
                print(f"✅ AI forecast data structure valid")
                # Check if AI summary is present
                if data.get('ai_summary'):
                    print(f"✅ AI summary generated successfully")
                else:
                    print(f"⚠️  AI summary is empty - may be using fallback mode")
        return success, data

    def test_data_sources_endpoint(self):
        """Test data sources endpoint"""
        return self.run_test("Data Sources", "GET", "data/sources", 200)

    def test_reset_data_endpoint(self):
        """Test reset data endpoint"""
        return self.run_test("Reset Data", "DELETE", "data/reset", 200)

    def test_seed_endpoint(self):
        """Test seed endpoint"""
        return self.run_test("Seed Data", "POST", "seed", 200)

    # NEW MODULE ENDPOINTS
    def test_recruitment_endpoint(self):
        """Test recruitment dashboard endpoint"""
        success, data = self.run_test("Recruitment Dashboard", "GET", "dashboard/recruitment?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'funnel', 'by_source', 'applications_by_month', 'pipeline_by_stage']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in recruitment response: {missing_keys}")
            else:
                print(f"✅ Recruitment data structure valid")
        return success, data

    def test_performance_endpoint(self):
        """Test performance dashboard endpoint"""
        success, data = self.run_test("Performance Dashboard", "GET", "dashboard/performance?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'distribution', 'by_department', 'by_band', 'top_performers']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in performance response: {missing_keys}")
            else:
                print(f"✅ Performance data structure valid")
        return success, data

    def test_learning_endpoint(self):
        """Test learning dashboard endpoint"""
        success, data = self.run_test("Learning Dashboard", "GET", "dashboard/learning?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'by_category', 'by_status', 'by_department', 'top_courses']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in learning response: {missing_keys}")
            else:
                print(f"✅ Learning data structure valid")
        return success, data

    def test_compensation_endpoint(self):
        """Test compensation dashboard endpoint"""
        success, data = self.run_test("Compensation Dashboard", "GET", "dashboard/compensation?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'by_band', 'by_department', 'salary_distribution', 'gender_by_band']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in compensation response: {missing_keys}")
            else:
                print(f"✅ Compensation data structure valid")
        return success, data

    def test_engagement_endpoint(self):
        """Test engagement dashboard endpoint"""
        success, data = self.run_test("Engagement Dashboard", "GET", "dashboard/engagement?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'by_department', 'score_distribution', 'drivers', 'enps_distribution']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in engagement response: {missing_keys}")
            else:
                print(f"✅ Engagement data structure valid")
        return success, data

    def test_career_endpoint(self):
        """Test career & talent dashboard endpoint"""
        success, data = self.run_test("Career & Talent Dashboard", "GET", "dashboard/career?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'talent_by_department', 'talent_by_band', 'leadership_pipeline']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in career response: {missing_keys}")
            else:
                print(f"✅ Career & Talent data structure valid")
        return success, data

    def test_hr_operations_endpoint(self):
        """Test HR operations dashboard endpoint"""
        success, data = self.run_test("HR Operations Dashboard", "GET", "dashboard/hr-operations?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'by_city', 'by_education', 'gender_distribution', 'department_metrics', 'operational_metrics']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in HR operations response: {missing_keys}")
            else:
                print(f"✅ HR Operations data structure valid")
        return success, data

    # NEW DEEP FEATURES: SKILLS MAP & CAREER DEVELOPMENT
    def test_skills_map_endpoint(self):
        """Test skills map dashboard endpoint"""
        success, data = self.run_test("Skills Map Dashboard", "GET", "dashboard/skills-map?year=2025", 200)
        if success and data:
            required_keys = ['all_skills', 'skill_gaps', 'critical_needs', 'category_distribution', 'department_heatmap', 'heatmap_skills', 'total_unique_skills']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in skills map response: {missing_keys}")
            else:
                print(f"✅ Skills Map data structure valid")
                print(f"   Total unique skills: {data.get('total_unique_skills', 0)}")
                print(f"   Skill gaps: {len(data.get('skill_gaps', []))}")
                print(f"   Critical needs: {len(data.get('critical_needs', []))}")
        return success, data

    def test_internal_mobility_endpoint(self):
        """Test internal mobility endpoint"""
        success, data = self.run_test("Internal Mobility", "GET", "dashboard/internal-mobility?year=2025", 200)
        if success and data:
            required_keys = ['department_needs', 'department_surplus', 'mobility_opportunities']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in internal mobility response: {missing_keys}")
            else:
                print(f"✅ Internal Mobility data structure valid")
                print(f"   Mobility opportunities: {len(data.get('mobility_opportunities', []))}")
        return success, data

    def test_employee_search_endpoint(self):
        """Test employee search endpoint"""
        success, data = self.run_test("Employee Search (Ahmet)", "GET", "employees/search?q=Ahmet&limit=10", 200)
        if success and data:
            required_keys = ['employees', 'total']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in employee search response: {missing_keys}")
            else:
                print(f"✅ Employee Search data structure valid")
                print(f"   Found {data.get('total', 0)} employees")
                if data.get('employees') and len(data['employees']) > 0:
                    # Store first employee ID for career plan test
                    self.test_employee_id = data['employees'][0].get('id')
                    print(f"   First employee: {data['employees'][0].get('name')} (ID: {self.test_employee_id})")
        return success, data

    def test_career_plan_endpoint(self):
        """Test AI career plan endpoint (may take 10-15 seconds for AI generation)"""
        # Use employee ID from search test, or fallback to a test
        if not hasattr(self, 'test_employee_id'):
            print("⚠️  No employee ID from search, attempting to get one...")
            success, search_data = self.test_employee_search_endpoint()
            if not success or not hasattr(self, 'test_employee_id'):
                print("❌ Cannot test career plan without valid employee ID")
                return False, {}
        
        print(f"   Using employee ID: {self.test_employee_id}")
        print(f"   ⏳ This may take 10-15 seconds for AI generation...")
        
        # Use longer timeout for AI endpoint
        url = f"{self.base_url}/employee/career-plan"
        headers = {'Content-Type': 'application/json'}
        self.tests_run += 1
        
        try:
            response = requests.post(url, json={"employee_id": self.test_employee_id}, headers=headers, timeout=60)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                data = response.json()
                required_keys = ['employee', 'skill_analysis', 'career_path', 'mentors', 'ai_recommendations']
                missing_keys = [k for k in required_keys if k not in data]
                if missing_keys:
                    print(f"⚠️  Missing keys in career plan response: {missing_keys}")
                else:
                    print(f"✅ Career Plan data structure valid")
                    print(f"   Employee: {data.get('employee', {}).get('name')}")
                    print(f"   Total skills: {data.get('skill_analysis', {}).get('total', 0)}")
                    print(f"   Mentors found: {len(data.get('mentors', []))}")
                    if data.get('ai_recommendations'):
                        print(f"✅ AI recommendations generated (length: {len(data['ai_recommendations'])} chars)")
                    else:
                        print(f"⚠️  AI recommendations empty - may be using fallback mode")
                return True, data
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                self.failed_tests.append({
                    "name": "AI Career Plan",
                    "endpoint": "employee/career-plan",
                    "expected": 200,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "name": "AI Career Plan",
                "endpoint": "employee/career-plan",
                "expected": 200,
                "actual": "Exception",
                "error": str(e)
            })
            return False, {}

    # PHASE 2: ADVANCED INSIGHTS ENDPOINTS
    def test_scenario_simulator_endpoint(self):
        """Test scenario simulator endpoint"""
        test_params = {
            "year": 2025,
            "growth_rate": 10,
            "budget_change": 5,
            "attrition_change": 2,
            "hiring_boost": 50,
            "new_location_headcount": 100
        }
        success, data = self.run_test("Scenario Simulator", "POST", "simulator/scenario", 200, test_params)
        if success and data:
            required_keys = ['current', 'projected', 'monthly_projections', 'department_impact', 'hiring_need', 'cost_delta']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in scenario simulator response: {missing_keys}")
            else:
                print(f"✅ Scenario Simulator data structure valid")
                print(f"   Current HC: {data.get('current', {}).get('headcount', 0)}")
                print(f"   Projected HC: {data.get('projected', {}).get('headcount', 0)}")
                print(f"   Net Change: {data.get('projected', {}).get('net_change', 0)}")
                print(f"   Hiring Need: {data.get('hiring_need', 0)}")
                print(f"   Monthly Projections: {len(data.get('monthly_projections', []))} months")
        return success, data

    def test_capability_forecast_endpoint(self):
        """Test capability forecasting endpoint"""
        success, data = self.run_test("Capability Forecast", "GET", "dashboard/capability-forecast?year=2025", 200)
        if success and data:
            required_keys = ['forecasts', 'critical_6m', 'warning_12m', 'top_demand', 'total_skills']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in capability forecast response: {missing_keys}")
            else:
                print(f"✅ Capability Forecast data structure valid")
                print(f"   Total Skills: {data.get('total_skills', 0)}")
                print(f"   Critical (6M): {len(data.get('critical_6m', []))}")
                print(f"   Warning (12M): {len(data.get('warning_12m', []))}")
                print(f"   Top Demand: {len(data.get('top_demand', []))}")
        return success, data

    def test_succession_planning_endpoint(self):
        """Test succession planning endpoint"""
        success, data = self.run_test("Succession Planning", "GET", "dashboard/succession?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'succession_map', 'risk_summary']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in succession planning response: {missing_keys}")
            else:
                print(f"✅ Succession Planning data structure valid")
                kpis = data.get('kpis', {})
                print(f"   Critical Roles: {kpis.get('critical_roles', 0)}")
                print(f"   No Successor: {kpis.get('no_successor', 0)}")
                print(f"   High Knowledge Risk: {kpis.get('high_knowledge_risk', 0)}")
                print(f"   Avg Readiness: {kpis.get('avg_readiness', 0)}%")
                print(f"   Succession Map: {len(data.get('succession_map', []))} roles")
        return success, data

    def test_burnout_warning_endpoint(self):
        """Test burnout early warning endpoint"""
        success, data = self.run_test("Burnout Early Warning", "GET", "dashboard/burnout?year=2025", 200)
        if success and data:
            required_keys = ['kpis', 'top_risk', 'department_risk', 'risk_distribution']
            missing_keys = [k for k in required_keys if k not in data]
            if missing_keys:
                print(f"⚠️  Missing keys in burnout warning response: {missing_keys}")
            else:
                print(f"✅ Burnout Warning data structure valid")
                kpis = data.get('kpis', {})
                print(f"   Total At Risk: {kpis.get('total_at_risk', 0)}")
                print(f"   Critical: {kpis.get('critical_count', 0)}")
                print(f"   Avg Risk Score: {kpis.get('avg_risk_score', 0)}")
                print(f"   Avg Engagement: {kpis.get('avg_engagement', 0)}/10")
                print(f"   High Risk Employees: {len(data.get('top_risk', []))}")
        return success, data

def main():
    print("🚀 Starting HRlytic API Testing...")
    print("=" * 60)
    
    tester = HRlyticAPITester()
    
    # Test all endpoints
    print("\n📊 Testing Core API Endpoints...")
    tester.test_root_endpoint()
    tester.test_years_endpoint()
    
    print("\n📈 Testing Dashboard Endpoints...")
    tester.test_overview_endpoint()
    tester.test_headcount_endpoint()
    tester.test_hires_endpoint()
    tester.test_leaves_endpoint()
    tester.test_turnover_endpoint()
    tester.test_movement_endpoint()
    
    print("\n🤖 Testing AI Forecast...")
    tester.test_ai_forecast_endpoint()
    
    print("\n💾 Testing Data Management...")
    tester.test_data_sources_endpoint()
    tester.test_reset_data_endpoint()
    tester.test_seed_endpoint()
    
    print("\n🆕 Testing New Module Endpoints...")
    tester.test_recruitment_endpoint()
    tester.test_performance_endpoint()
    tester.test_learning_endpoint()
    tester.test_compensation_endpoint()
    tester.test_engagement_endpoint()
    tester.test_career_endpoint()
    tester.test_hr_operations_endpoint()
    
    print("\n🎯 Testing Deep Features: Skills Map & Career Development...")
    tester.test_skills_map_endpoint()
    tester.test_internal_mobility_endpoint()
    tester.test_employee_search_endpoint()
    tester.test_career_plan_endpoint()
    
    print("\n🚀 Testing Phase 2: Advanced Insights...")
    tester.test_scenario_simulator_endpoint()
    tester.test_capability_forecast_endpoint()
    tester.test_succession_planning_endpoint()
    tester.test_burnout_warning_endpoint()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for test in tester.failed_tests:
            print(f"   • {test['name']}: Expected {test['expected']}, got {test['actual']}")
            if test['error']:
                print(f"     Error: {test['error']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())