#!/usr/bin/env python3
"""
Script to update health insurance data from Skyline.pdf
This script will add new companies, age groups, and pricing data to the database
"""

import os
import sys
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """Create and return a Supabase client"""
    # Using the values from env.example
    url = "https://fctvityawavmuethxxix.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdHZpdHlhd2F2bXVldGh4eGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzA5ODAsImV4cCI6MjA3MDY0Njk4MH0.d6T4MrGgV3vKZjcQ02vjf8_oDeRu9SJQXNgA0LJHlq0"
    
    return create_client(url, key)

def add_companies(supabase: Client):
    """Add new insurance companies"""
    print("Adding new insurance companies...")
    
    companies = [
        {'name': 'Magdeburger Sigorta Eco', 'name_ar': 'Magdeburger Sigorta Eco', 'is_active': True},
        {'name': 'Magdeburger Gümüş', 'name_ar': 'Magdeburger Gümüş', 'is_active': True},
        {'name': 'Magdeburger Sigorta', 'name_ar': 'Magdeburger Sigorta', 'is_active': True},
        {'name': 'Ankara Sigorta Eco', 'name_ar': 'Ankara Sigorta Eco', 'is_active': True},
        {'name': 'Ankara Sigorta', 'name_ar': 'Ankara Sigorta', 'is_active': True}
    ]
    
    for company in companies:
        try:
            result = supabase.table('insurance_companies').upsert(company).execute()
            print(f"Added/Updated company: {company['name']}")
        except Exception as e:
            print(f"Error adding company {company['name']}: {e}")

def update_age_groups(supabase: Client):
    """Update age groups to match PDF data"""
    print("Updating age groups...")
    
    age_groups = [
        {'min_age': 0, 'max_age': 16, 'name': '0-16 years', 'name_ar': '0-16 سنة', 'is_active': True},
        {'min_age': 17, 'max_age': 25, 'name': '17-25 years', 'name_ar': '17-25 سنة', 'is_active': True},
        {'min_age': 26, 'max_age': 35, 'name': '26-35 years', 'name_ar': '26-35 سنة', 'is_active': True},
        {'min_age': 36, 'max_age': 45, 'name': '36-45 years', 'name_ar': '36-45 سنة', 'is_active': True},
        {'min_age': 46, 'max_age': 55, 'name': '46-55 years', 'name_ar': '46-55 سنة', 'is_active': True},
        {'min_age': 56, 'max_age': 60, 'name': '56-60 years', 'name_ar': '56-60 سنة', 'is_active': True},
        {'min_age': 61, 'max_age': 65, 'name': '61-65 years', 'name_ar': '61-65 سنة', 'is_active': True},
        {'min_age': 66, 'max_age': 70, 'name': '66-70 years', 'name_ar': '66-70 سنة', 'is_active': True},
        {'min_age': 0, 'max_age': 15, 'name': '0-15 years', 'name_ar': '0-15 سنة', 'is_active': True},
        {'min_age': 16, 'max_age': 35, 'name': '16-35 years', 'name_ar': '16-35 سنة', 'is_active': True},
        {'min_age': 46, 'max_age': 50, 'name': '46-50 years', 'name_ar': '46-50 سنة', 'is_active': True},
        {'min_age': 51, 'max_age': 55, 'name': '51-55 years', 'name_ar': '51-55 سنة', 'is_active': True},
        {'min_age': 66, 'max_age': 69, 'name': '66-69 years', 'name_ar': '66-69 سنة', 'is_active': True}
    ]
    
    for age_group in age_groups:
        try:
            result = supabase.table('age_groups').upsert(age_group).execute()
            print(f"Added/Updated age group: {age_group['name']}")
        except Exception as e:
            print(f"Error adding age group {age_group['name']}: {e}")

def add_pricing_data(supabase: Client):
    """Add pricing data from PDF"""
    print("Adding pricing data...")
    
    # Get companies and age groups
    companies_result = supabase.table('insurance_companies').select('id, name').execute()
    age_groups_result = supabase.table('age_groups').select('id, min_age, max_age').execute()
    
    companies = {c['name']: c['id'] for c in companies_result.data}
    age_groups = {(ag['min_age'], ag['max_age']): ag['id'] for ag in age_groups_result.data}
    
    # Pricing data from PDF
    pricing_data = [
        # Magdeburger Sigorta Eco
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (0, 16), 'duration': 12, 'price': 1050.00},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (0, 16), 'duration': 24, 'price': 1575.50},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (17, 25), 'duration': 12, 'price': 410.50},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (17, 25), 'duration': 24, 'price': 482.25},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (26, 35), 'duration': 12, 'price': 418.10},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (26, 35), 'duration': 24, 'price': 447.88},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (36, 45), 'duration': 12, 'price': 500.25},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (36, 45), 'duration': 24, 'price': 544.88},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (46, 55), 'duration': 12, 'price': 645.20},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (46, 55), 'duration': 24, 'price': 725.75},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (56, 60), 'duration': 12, 'price': 809.50},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (56, 60), 'duration': 24, 'price': 882.25},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (61, 65), 'duration': 12, 'price': 1110.75},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (61, 65), 'duration': 24, 'price': 1212.13},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (66, 70), 'duration': 12, 'price': 1851.30},
        {'company': 'Magdeburger Sigorta Eco', 'age_range': (66, 70), 'duration': 24, 'price': 2120.25},
        
        # Magdeburger Gümüş
        {'company': 'Magdeburger Gümüş', 'age_range': (0, 16), 'duration': 12, 'price': 1837.50},
        {'company': 'Magdeburger Gümüş', 'age_range': (0, 16), 'duration': 24, 'price': 1968.75},
        {'company': 'Magdeburger Gümüş', 'age_range': (17, 25), 'duration': 12, 'price': 1023.25},
        {'company': 'Magdeburger Gümüş', 'age_range': (17, 25), 'duration': 24, 'price': 1096.75},
        {'company': 'Magdeburger Gümüş', 'age_range': (26, 35), 'duration': 12, 'price': 1044.25},
        {'company': 'Magdeburger Gümüş', 'age_range': (26, 35), 'duration': 24, 'price': 1118.88},
        {'company': 'Magdeburger Gümüş', 'age_range': (36, 45), 'duration': 12, 'price': 1317.25},
        {'company': 'Magdeburger Gümüş', 'age_range': (36, 45), 'duration': 24, 'price': 1362.88},
        {'company': 'Magdeburger Gümüş', 'age_range': (46, 55), 'duration': 12, 'price': 1449.50},
        {'company': 'Magdeburger Gümüş', 'age_range': (46, 55), 'duration': 24, 'price': 1529.75},
        {'company': 'Magdeburger Gümüş', 'age_range': (56, 60), 'duration': 12, 'price': 1764.00},
        {'company': 'Magdeburger Gümüş', 'age_range': (56, 60), 'duration': 24, 'price': 1764.00},
        {'company': 'Magdeburger Gümüş', 'age_range': (61, 65), 'duration': 12, 'price': 1917.75},
        {'company': 'Magdeburger Gümüş', 'age_range': (61, 65), 'duration': 24, 'price': 1968.13},
        {'company': 'Magdeburger Gümüş', 'age_range': (66, 70), 'duration': 12, 'price': 3029.40},
        {'company': 'Magdeburger Gümüş', 'age_range': (66, 70), 'duration': 24, 'price': 3281.25},
        
        # Magdeburger Sigorta
        {'company': 'Magdeburger Sigorta', 'age_range': (0, 16), 'duration': 12, 'price': 5250.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (0, 16), 'duration': 24, 'price': 7875.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (17, 25), 'duration': 12, 'price': 2925.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (17, 25), 'duration': 24, 'price': 4387.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (26, 35), 'duration': 12, 'price': 2985.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (26, 35), 'duration': 24, 'price': 4477.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (36, 45), 'duration': 12, 'price': 4545.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (36, 45), 'duration': 24, 'price': 6817.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (46, 55), 'duration': 12, 'price': 5370.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (46, 55), 'duration': 24, 'price': 7000.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (56, 60), 'duration': 12, 'price': 7350.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (56, 60), 'duration': 24, 'price': 11025.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (61, 65), 'duration': 12, 'price': 10095.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (61, 65), 'duration': 24, 'price': 15142.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (66, 69), 'duration': 12, 'price': 16830.00},
        {'company': 'Magdeburger Sigorta', 'age_range': (66, 69), 'duration': 24, 'price': 25245.00},
        
        # Ankara Sigorta Eco
        {'company': 'Ankara Sigorta Eco', 'age_range': (0, 15), 'duration': 12, 'price': 2850.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (0, 15), 'duration': 24, 'price': 2850.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (16, 35), 'duration': 12, 'price': 1100.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (16, 35), 'duration': 24, 'price': 1100.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (36, 45), 'duration': 12, 'price': 1330.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (36, 45), 'duration': 24, 'price': 1330.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (46, 50), 'duration': 12, 'price': 1430.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (46, 50), 'duration': 24, 'price': 1430.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (51, 55), 'duration': 12, 'price': 1450.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (51, 55), 'duration': 24, 'price': 1450.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (56, 60), 'duration': 12, 'price': 1750.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (56, 60), 'duration': 24, 'price': 1750.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (61, 65), 'duration': 12, 'price': 1950.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (61, 65), 'duration': 24, 'price': 1950.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (66, 69), 'duration': 12, 'price': 5100.00},
        {'company': 'Ankara Sigorta Eco', 'age_range': (66, 69), 'duration': 24, 'price': 5100.00},
        
        # Ankara Sigorta
        {'company': 'Ankara Sigorta', 'age_range': (0, 15), 'duration': 12, 'price': 5985.00},
        {'company': 'Ankara Sigorta', 'age_range': (0, 15), 'duration': 24, 'price': 5985.00},
        {'company': 'Ankara Sigorta', 'age_range': (16, 35), 'duration': 12, 'price': 2970.00},
        {'company': 'Ankara Sigorta', 'age_range': (16, 35), 'duration': 24, 'price': 2970.00},
        {'company': 'Ankara Sigorta', 'age_range': (36, 45), 'duration': 12, 'price': 3325.00},
        {'company': 'Ankara Sigorta', 'age_range': (36, 45), 'duration': 24, 'price': 3325.00},
        {'company': 'Ankara Sigorta', 'age_range': (46, 50), 'duration': 12, 'price': 4719.00},
        {'company': 'Ankara Sigorta', 'age_range': (46, 50), 'duration': 24, 'price': 4719.00},
        {'company': 'Ankara Sigorta', 'age_range': (51, 55), 'duration': 12, 'price': 5220.00},
        {'company': 'Ankara Sigorta', 'age_range': (51, 55), 'duration': 24, 'price': 5220.00},
        {'company': 'Ankara Sigorta', 'age_range': (56, 60), 'duration': 12, 'price': 5950.00},
        {'company': 'Ankara Sigorta', 'age_range': (56, 60), 'duration': 24, 'price': 5950.00},
        {'company': 'Ankara Sigorta', 'age_range': (61, 65), 'duration': 12, 'price': 6825.00},
        {'company': 'Ankara Sigorta', 'age_range': (61, 65), 'duration': 24, 'price': 6825.00},
        {'company': 'Ankara Sigorta', 'age_range': (66, 69), 'duration': 12, 'price': 11220.00},
        {'company': 'Ankara Sigorta', 'age_range': (66, 69), 'duration': 24, 'price': 11220.00}
    ]
    
    for pricing in pricing_data:
        try:
            company_id = companies.get(pricing['company'])
            age_group_id = age_groups.get(pricing['age_range'])
            
            if company_id and age_group_id:
                pricing_record = {
                    'company_id': company_id,
                    'age_group_id': age_group_id,
                    'duration_months': pricing['duration'],
                    'price_try': pricing['price']
                }
                
                result = supabase.table('health_insurance_pricing').upsert(pricing_record).execute()
                print(f"Added pricing for {pricing['company']} - Age {pricing['age_range']} - {pricing['duration']} months: {pricing['price']} TL")
            else:
                print(f"Missing company or age group for {pricing['company']} - Age {pricing['age_range']}")
                
        except Exception as e:
            print(f"Error adding pricing for {pricing['company']}: {e}")

def main():
    """Main function"""
    print("Health Insurance Data Update Script")
    print("===================================")
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Add companies
    add_companies(supabase)
    
    # Update age groups
    update_age_groups(supabase)
    
    # Add pricing data
    add_pricing_data(supabase)
    
    print("\nUpdate completed successfully!")
    print("The health insurance data has been updated with the information from Skyline.pdf")

if __name__ == "__main__":
    main()
