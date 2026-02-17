// CV Template - Clean & Professional
// Optimized for tech/AI companies like Anthropic

#set document(title: "CV - Jules Mudès", author: "Jules Mudès")
#set page(margin: (x: 2cm, y: 1.8cm))
#set text(font: "Arial", size: 10pt)

// Header
#align(center)[
  #text(size: 20pt, weight: "bold")[Jules Mudès]
  
  #text(size: 10pt, fill: rgb("#555"))[
    Senior Software Engineer • Paris, France \
    #link("mailto:jules.mudes@email.com")[jules.mudes\@email.com] •
    #link("https://github.com/julesmudes")[github.com/julesmudes] •
    #link("https://linkedin.com/in/julesmudes")[LinkedIn]
  ]
]

#v(0.5cm)
#line(length: 100%, stroke: 0.5pt + rgb("#ddd"))
#v(0.3cm)

// Summary
#text(weight: "bold", size: 11pt)[Summary]
#v(0.2cm)
Software engineer with 9+ years of experience building scalable systems and leading technical teams. Deep expertise in distributed systems, cloud architecture, and AI/ML infrastructure. Passionate about building tools that augment human capabilities.

#v(0.4cm)

// Experience
#text(weight: "bold", size: 11pt)[Experience]
#v(0.2cm)

#grid(
  columns: (1fr, auto),
  [*Lead Software Engineer* — Capgemini],
  [_Jan 2017 – Present_]
)
#v(0.1cm)
- Led architecture and development of cloud-native platforms serving 2M+ daily users
- Designed and implemented ML pipelines for real-time recommendation systems
- Mentored team of 8 engineers, established coding standards and CI/CD practices
- Reduced infrastructure costs by 40% through Kubernetes optimization
- Key technologies: Python, TypeScript, Go, AWS, Kubernetes, TensorFlow

#v(0.3cm)

#grid(
  columns: (1fr, auto),
  [*Software Engineer* — Tech Startup],
  [_Jun 2014 – Dec 2016_]
)
#v(0.1cm)
- Built core backend services handling 50K+ requests/minute
- Implemented real-time data processing pipeline with Kafka and Spark
- Collaborated with product team to ship features on weekly release cycles

#v(0.4cm)

// Skills
#text(weight: "bold", size: 11pt)[Technical Skills]
#v(0.2cm)
#grid(
  columns: (auto, 1fr),
  column-gutter: 1cm,
  row-gutter: 0.3cm,
  [*Languages:*], [Python, TypeScript, Go, Rust, SQL],
  [*AI/ML:*], [PyTorch, TensorFlow, LangChain, Vector DBs, RAG systems],
  [*Infrastructure:*], [AWS, GCP, Kubernetes, Docker, Terraform],
  [*Data:*], [PostgreSQL, Redis, Kafka, Elasticsearch],
)

#v(0.4cm)

// Projects
#text(weight: "bold", size: 11pt)[Notable Projects]
#v(0.2cm)
- *AI Assistant Platform* — Built multi-agent system with tool-use capabilities, serving 10K+ users
- *Open Source CLI Tool* — 2K+ GitHub stars, featured in popular tech newsletters
- *Real-time Analytics Dashboard* — Sub-second latency for 100M+ events/day

#v(0.4cm)

// Education
#text(weight: "bold", size: 11pt)[Education]
#v(0.2cm)
#grid(
  columns: (1fr, auto),
  [*Master's in Computer Science* — École Polytechnique],
  [_2012 – 2014_]
)
Specialization in Distributed Systems and Machine Learning

#v(0.4cm)

// Languages
#text(weight: "bold", size: 11pt)[Languages]
#v(0.2cm)
French (native) • English (fluent) • Italian (intermediate)
