const SKILLS = [
    // Languages
    "JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby",
    "PHP", "Swift", "Kotlin", "Scala", "R", "Perl", "Elixir", "Haskell", "Dart",
    "Julia", "Lua", "MATLAB", "Bash", "Groovy", "Clojure", "Erlang", "F#", "OCaml",
    "COBOL", "Fortran", "Assembly", "Objective-C", "Crystal", "Nim", "Zig",

    // Frontend frameworks/libraries
    "React", "Vue.js", "Angular", "Next.js", "Nuxt.js", "Svelte", "SolidJS",
    "Redux", "MobX", "Zustand", "Recoil", "jQuery", "Backbone.js", "Ember.js",
    "Astro", "Remix", "Gatsby", "Storybook", "Webpack", "Vite", "Rollup", "Parcel",
    "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "Ant Design",
    "SASS", "SCSS", "CSS Modules", "Styled Components", "Emotion",
    "HTML5", "CSS3", "WebSockets", "Web Components", "PWA", "WebAssembly",
    "Three.js", "D3.js", "Chart.js",

    // Backend frameworks
    "Node.js", "Express", "NestJS", "Fastify", "Hapi.js", "Koa",
    "Spring Boot", "Spring", "Spring MVC", "Spring Security", "Spring Cloud",
    "Django", "FastAPI", "Flask", "Tornado", "Sanic", "Celery",
    "Ruby on Rails", "Sinatra",
    "Laravel", "Symfony", "CodeIgniter",
    "Gin", "Echo", "Fiber", "Beego",
    "ASP.NET", ".NET", ".NET Core",
    "Actix", "Axum", "Rocket",
    "Phoenix", "Ecto",
    "Ktor", "Exposed",
    "Micronaut", "Quarkus", "Helidon",
    "gRPC",

    // Mobile
    "React Native", "Flutter", "SwiftUI", "Jetpack Compose",
    "Xamarin", "Ionic", "Cordova", "Capacitor", "Expo",
    "Android SDK", "iOS", "Xcode",

    // Databases & Storage
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "OpenSearch",
    "Cassandra", "DynamoDB", "SQLite", "Oracle", "SQL Server", "MariaDB",
    "Neo4j", "InfluxDB", "CockroachDB", "Snowflake", "BigQuery", "Redshift",
    "Firebase", "Firestore", "Supabase", "PlanetScale", "TimescaleDB", "ClickHouse",
    "Memcached", "RabbitMQ", "Apache Kafka", "Kafka", "NATS", "ActiveMQ",
    "MinIO", "Ceph", "HDFS",

    // Cloud
    "AWS", "GCP", "Azure", "Google Cloud", "Cloudflare", "DigitalOcean",
    "Heroku", "Vercel", "Netlify", "Fly.io", "Railway",
    "AWS Lambda", "EC2", "S3", "ECS", "EKS", "RDS", "CloudFront", "SQS", "SNS",
    "Google Kubernetes Engine", "Cloud Run", "Cloud Functions",

    // DevOps / Infrastructure
    "Docker", "Kubernetes", "Terraform", "Ansible", "Puppet", "Chef", "SaltStack",
    "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "Travis CI",
    "ArgoCD", "FluxCD", "Spinnaker", "Helm", "Kustomize",
    "Nginx", "Apache", "HAProxy", "Traefik", "Envoy", "Istio", "Linkerd",
    "Prometheus", "Grafana", "Loki", "Jaeger", "Zipkin", "OpenTelemetry",
    "ELK Stack", "Elasticsearch", "Logstash", "Kibana", "Datadog", "New Relic",
    "Splunk", "PagerDuty",
    "HashiCorp Vault", "Consul", "Packer",
    "Linux", "Unix", "Ubuntu", "CentOS", "Debian",
    "Bash", "PowerShell",

    // Data & Analytics
    "Apache Spark", "Spark", "Hadoop", "Apache Flink", "Flink",
    "Apache Airflow", "Airflow", "Prefect", "Dagster", "Luigi",
    "dbt", "DBT",
    "Apache Beam", "Dataflow",
    "Kafka Streams",
    "Databricks", "Delta Lake",
    "Power BI", "Tableau", "Looker", "Metabase", "Superset",
    "Jupyter", "Pandas", "NumPy", "SciPy", "Polars",
    "ETL", "ELT",

    // ML / AI
    "TensorFlow", "PyTorch", "Keras", "JAX", "Flax",
    "Scikit-learn", "XGBoost", "LightGBM", "CatBoost",
    "Hugging Face", "Transformers", "LangChain", "LlamaIndex",
    "OpenAI", "BERT", "GPT", "LLM", "RAG",
    "MLflow", "Weights & Biases", "Kubeflow", "Ray", "BentoML",
    "ONNX", "TensorRT", "CUDA", "OpenCV",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Reinforcement Learning", "Federated Learning",

    // API & Communication
    "REST", "RESTful", "GraphQL", "gRPC", "WebSockets", "WebRTC",
    "OpenAPI", "Swagger", "Postman", "AsyncAPI",
    "OAuth", "OAuth2", "JWT", "SAML", "SSO", "LDAP", "OpenID Connect",

    // Testing
    "Jest", "Vitest", "Mocha", "Jasmine", "Cypress", "Playwright", "Puppeteer",
    "Selenium", "WebDriver", "Testing Library",
    "JUnit", "TestNG", "Mockito", "Spring Test",
    "Pytest", "unittest", "Hypothesis",
    "RSpec", "Minitest",
    "Go test", "Testify",
    "k6", "Gatling", "JMeter",

    // Security
    "OWASP", "Penetration Testing", "Burp Suite", "Metasploit",
    "Vault", "Secrets Management", "Zero Trust", "mTLS",
    "SIEM", "SOC", "Threat Modeling", "SAST", "DAST",

    // Tools & Practices
    "Git", "GitHub", "GitLab", "Bitbucket",
    "Jira", "Confluence", "Linear", "Notion", "Asana",
    "Figma", "Sketch", "Zeplin",
    "CI/CD", "DevOps", "GitOps", "SRE",
    "Agile", "Scrum", "Kanban", "SAFe",
    "TDD", "BDD", "DDD", "CQRS", "Event Sourcing",
    "Microservices", "Monorepo", "Serverless",
    "System Design", "Distributed Systems",
];

// Precompile patterns for performance
const SKILL_PATTERNS = SKILLS.map((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return {
        canonical: skill,
        pattern: new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, "i"),
    };
});

// Deduplicate skills list (some appear twice like Kafka, Spark)
const seenCanonical = new Set();
const UNIQUE_SKILL_PATTERNS = SKILL_PATTERNS.filter(({ canonical }) => {
    if (seenCanonical.has(canonical.toLowerCase())) return false;
    seenCanonical.add(canonical.toLowerCase());
    return true;
});

function extractSkills(title, description) {
    const text = `${title || ""} ${description || ""}`;
    const matched = [];
    for (const { canonical, pattern } of UNIQUE_SKILL_PATTERNS) {
        if (pattern.test(text)) {
            matched.push(canonical);
        }
    }
    return matched;
}

function detectRoleFamily(title) {
    if (!title) return "Engineering";
    const t = title.toLowerCase();
    if (/\b(ml|machine learning|ai |artificial intelligence|data scientist|nlp|computer vision)\b/.test(t)) return "ML/AI";
    if (/\b(data engineer|data analyst|analytics|business intelligence|bi |etl|data pipeline)\b/.test(t)) return "Data";
    if (/\b(devops|sre|site reliability|platform engineer|infrastructure|cloud engineer|devsecops)\b/.test(t)) return "DevOps";
    if (/\b(security|cyber|penetration|appsec|infosec|soc analyst)\b/.test(t)) return "Security";
    if (/\b(mobile|android|ios|flutter|react native)\b/.test(t)) return "Mobile";
    if (/\b(frontend|front-end|front end|ui engineer|ux engineer)\b/.test(t)) return "Frontend";
    if (/\bfull.?stack\b/.test(t)) return "Full Stack";
    if (/\b(qa|quality assurance|quality engineer|automation engineer|test engineer|sdet)\b/.test(t)) return "QA";
    if (/\b(product manager|pm |product owner|program manager)\b/.test(t)) return "Product";
    if (/\b(backend|back-end|back end|server-side|api engineer|java developer|python developer|node developer)\b/.test(t)) return "Backend";
    return "Engineering";
}

function detectSeniority(title) {
    if (!title) return "Mid";
    const t = title.toLowerCase();
    if (/\bintern(ship)?\b/.test(t)) return "Intern";
    if (/\b(vp|vice president)\b/.test(t)) return "VP";
    if (/\bdirector\b/.test(t)) return "Director";
    if (/\b(principal|distinguished|fellow)\b/.test(t)) return "Principal";
    if (/\bstaff\b/.test(t)) return "Staff";
    if (/\b(lead|tech lead|team lead|engineering lead)\b/.test(t)) return "Lead";
    if (/\b(senior|sr\.?)\b/.test(t)) return "Senior";
    if (/\b(junior|jr\.?|entry.?level|graduate|fresher|associate)\b/.test(t)) return "Junior";
    if (/\b(mid.?level|intermediate|mid senior)\b/.test(t)) return "Mid";
    return "Mid";
}

module.exports = { extractSkills, detectRoleFamily, detectSeniority };
