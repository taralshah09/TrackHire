import os
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime, timedelta
import re

# Database connection parameters
DB_USER="postgres.zfkihvbeqrkhlfjdxrhi"
DB_PASSWORD="trackhire#8559"
DB_URL="postgresql://postgres:trackhire#8559@db.zfkihvbeqrkhlfjdxrhi.supabase.co:5432/postgres"
DB_PORT=6543
DB_HOST="aws-1-ap-southeast-1.pooler.supabase.com"
DB_NAME="postgres"
DB_SSL=True
DB_SCHEMA="jobs_tracker_v1"

# List of common tech and business skills to extract
SKILLS_LIST = [
    "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Ruby", "Go", "Rust", "PHP",
    "React", "Angular", "Vue.js", "Node.js", "Spring Boot", "Django", "Flask", "Express",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "Git",
    "Machine Learning", "Data Science", "AI", "NLP", "Computer Vision",
    "HTML", "CSS", "Tailwind", "Bootstrap", "GraphQL", "REST API",
    "Linux", "Unix", "Bash", "Shell", "Agile", "Scrum", "Jira", "Figma",
    "Next.js", "NestJS", "Kafka", "RabbitMQ"
]

def extract_skills(description):
    """Simple keyword matching to extract skills from description."""
    if not description:
        return []
    
    desc_lower = description.lower()
    found_skills = []
    
    for skill in SKILLS_LIST:
        # We handle special characters like C++ or Node.js by properly escaping them in regex
        # Using word boundary to avoid matching substrings like "go" in "good"
        # For C++ or C# we need a slightly different boundary as \b doesn't match symbols
        if skill in ["C++", "C#", ".NET"]:
            pattern = r'(?:\s|^)' + re.escape(skill.lower()) + r'(?:\s|$|[.,!?;:])'
        else:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            
        if re.search(pattern, desc_lower):
            found_skills.append(skill)
            
    return found_skills

def process_jobs():
    print("Connecting to the database...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT,
            sslmode='require' if DB_SSL else 'prefer'
        )
        cur = conn.cursor()

        # Get the date 20 days ago
        twenty_days_ago = datetime.now() - timedelta(days=20)
        
        print(f"Fetching jobs posted after {twenty_days_ago.date()}...")
        
        # Using the schema defined at the top
        schema = DB_SCHEMA
        
        cur.execute(f"""
            SELECT id, description 
            FROM {schema}.jobs 
            WHERE posted_at >= %s
        """, (twenty_days_ago,))
        
        jobs = cur.fetchall()
        print(f"Found {len(jobs)} jobs from the last 20 days.")

        if not jobs:
            print("No jobs found to process.")
            return

        skills_to_insert = []
        job_ids_processed = []
        now = datetime.now()
        
        print("Extracting skills...")
        for job_id, description in jobs:
            skills = extract_skills(description)
            job_ids_processed.append(job_id)
            
            for skill in skills:
                skills_to_insert.append((job_id, skill, now))
                
        if skills_to_insert:
            print(f"Deleting existing skills for these {len(job_ids_processed)} jobs to avoid duplicates...")
            delete_query = f"DELETE FROM {schema}.job_skills WHERE job_id = ANY(%s)"
            cur.execute(delete_query, (job_ids_processed,))
            
            print(f"Inserting {len(skills_to_insert)} extracted skill records...")
            insert_query = f"""
                INSERT INTO {schema}.job_skills (job_id, skill, created_at)
                VALUES (%s, %s, %s)
            """
            execute_batch(cur, insert_query, skills_to_insert)
            conn.commit()
            print("Successfully processed and saved skills!")
        else:
            print("No skills could be extracted from the recent jobs.")

    except Exception as e:
        print(f"Error processing jobs: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    process_jobs()
