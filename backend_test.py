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