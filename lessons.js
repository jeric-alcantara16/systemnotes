// ==========================================================================
// SYSTEM DESIGN & ARCHITECTURE LESSONS DATA
// ==========================================================================

const SYSTEM_DESIGN_LESSONS = [
    {
        id: "foundations",
        title: "Foundations & The Design Process",
        category: "Core Concepts",
        content: `
            <h1>Foundations & The Design Process</h1>
            <p>System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements. Before writing code, you must design a system that is scalable, reliable, and maintainable.</p>

            <div class="alert alert-important">
                <div class="alert-title">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    The Golden Rule of System Design
                </div>
                Never start proposing solutions immediately. A great system designer always clarifies requirements, analyzes constraints, and estimates scale first.
            </div>

            <h2>Requirements Elicitation: Functional vs. Non-Functional</h2>
            <p>Requirements are the bedrock of any design. They are divided into two categories:</p>
            <ul>
                <li><strong>Functional Requirements:</strong> Define the behaviors and features of the system. For a social network, they include: "Users can upload photos," "Users can add friends," and "Users can view a timeline."</li>
                <li><strong>Non-Functional Requirements (NFRs):</strong> Define the quality attributes and operational constraints of the system. These are crucial because they dictate the architectural choices. Typical NFRs include:
                    <ul>
                        <li><strong>Availability:</strong> The fraction of time the system remains operational (e.g., 99.99% availability).</li>
                        <li><strong>Latency:</strong> The response time of services (e.g., successful page loads in < 200ms at p99).</li>
                        <li><strong>Consistency vs. Availability:</strong> Determining if the system favors returning accurate data immediately (CP) or remaining responsive even if data is slightly stale (AP).</li>
                        <li><strong>Scalability:</strong> The system's ability to handle growing workloads by adding resources.</li>
                    </ul>
                </li>
            </ul>

            <!-- pagebreak -->
            <h2>Step-by-Step Back-of-the-Envelope Estimation (Mathematics)</h2>
            <p>Back-of-the-envelope calculations estimate storage, memory, QPS (Queries Per Second), and network bandwidth before drafting database schemas. Let's run a complete estimation for a photo-sharing system:</p>

            <h3>1. Base Scale Constraints:</h3>
            <ul>
                <li>Daily Active Users (DAU): 100 Million</li>
                <li>Average posts per user per day: 2 photos</li>
                <li>Average size of a photo: 250 KB</li>
            </ul>

            <h3>2. QPS Calculations:</h3>
            <p>First, calculate total daily write requests: <code>100 Million DAU * 2 posts/day = 200 Million writes/day</code>.</p>
            <p>Convert daily writes to writes per second:</p>
            <pre><code>Writes QPS = 200,000,000 requests / 86,400 seconds ≈ 2,315 writes/sec</code></pre>
            <p>If we assume a 10:1 read-to-write ratio (10 reads for every write), we get:</p>
            <pre><code>Reads QPS = 2,315 * 10 = 23,150 reads/sec</code></pre>
            <p>Peak QPS is estimated as 2x average QPS: <code>Peak Reads QPS = 23,150 * 2 ≈ 46,300 reads/sec</code>.</p>

            <!-- pagebreak -->
            <h3>3. Storage and Bandwidth Calculations:</h3>
            <p>Calculate daily storage footprint for raw media:</p>
            <pre><code>Daily Write Storage = 200 Million posts * 250 KB = 50,000,000,000 KB = 50 TB/day</code></pre>
            <p>To store these photos for 5 years, total storage required is:</p>
            <pre><code>5-Year Storage = 50 TB/day * 365 days/year * 5 years ≈ 91.25 PB</code></pre>
            <p>Calculate network bandwidth requirements for writes (ingress):</p>
            <pre><code>Ingress Bandwidth = (200 Million * 250 KB) / 86,400 sec ≈ 578 MB/sec = 4.62 Gbps</code></pre>
            <p>And read bandwidth (egress) assuming 10:1 read-to-write ratio:</p>
            <pre><code>Egress Bandwidth = 578 MB/sec * 10 = 5.78 GB/sec = 46.24 Gbps</code></pre>

            <!-- pagebreak -->
            <h2>API Design & Schema Modeling</h2>
            <p>Once constraints are defined, outline the API interface contract and database schemas. For a typical RESTful API design, define operations clearly using standard HTTP verbs:</p>
            <ul>
                <li><code>POST /v1/users/{userId}/photos</code> - Upload a new photo. Body: JSON containing photo metadata and image URL. Returns: Photo ID.</li>
                <li><code>GET /v1/photos/{photoId}</code> - Retrieve photo metadata. Returns: JSON metadata.</li>
                <li><code>DELETE /v1/photos/{photoId}</code> - Delete a photo. Returns: HTTP 200/204.</li>
            </ul>

            <h3>Selecting the Right Database Category</h3>
            <ul>
                <li><strong>Relational DBs (SQL):</strong> Best when data requires strict ACID transactions and relational links. Ideal for billing, accounting, and user authentication tables. *Examples: PostgreSQL, MySQL.*</li>
                <li><strong>Non-Relational DBs (NoSQL):</strong> Best for elastic scaling, high throughput, and semi-structured payloads. Essential for caching, logs, and document-based metadata. *Examples: DynamoDB, MongoDB.*</li>
            </ul>

            <!-- pagebreak -->
            <h2>Latency Numbers Every Programmer Should Know</h2>
            <p>To design efficient distributed systems, understanding hardware execution boundaries is essential. CPU speeds are nanoseconds, SSD reads are milliseconds, and WAN network traffic takes tens of milliseconds:</p>
            <table>
                <thead>
                    <tr>
                        <th>Operation</th>
                        <th>Actual Time</th>
                        <th>Human Scale (Scaled up)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>L1 Cache Reference</td>
                        <td>0.5 ns</td>
                        <td>0.5 seconds</td>
                    </tr>
                    <tr>
                        <td>L2 Cache Reference</td>
                        <td>7 ns</td>
                        <td>7 seconds</td>
                    </tr>
                    <tr>
                        <td>Main Memory Reference (RAM)</td>
                        <td>100 ns</td>
                        <td>100 seconds (1.6 mins)</td>
                    </tr>
                    <tr>
                        <td>Read 1 MB sequentially from SSD</td>
                        <td>1,000,000 ns (1 ms)</td>
                        <td>11.5 days</td>
                    </tr>
                    <tr>
                        <td>Disk Seek (HDD)</td>
                        <td>10,000,000 ns (10 ms)</td>
                        <td>3.8 months</td>
                    </tr>
                    <tr>
                        <td>Send packet USA to Europe & back</td>
                        <td>150,000,000 ns (150 ms)</td>
                        <td>4.75 years</td>
                    </tr>
                </tbody>
            </table>
            <p><strong>Design Implication:</strong> Disk access is thousands of times slower than memory access. Therefore, scaling database query performance requires aggressive caching strategies (in-memory caching) to avoid hitting disk boundaries.</p>
                `,
        visualizer: {'type': 'flowchart', 'data': {'steps': [{'name': 'Clarify Requirements', 'desc': 'Define functional & non-functional requirements'}, {'name': 'Back-of-Envelope Math', 'desc': 'Estimate traffic, storage, and network needs'}, {'name': 'API Design & Schema', 'desc': 'Draft API endpoints and database tables'}, {'name': 'High-Level Architecture', 'desc': 'Sketch core services, load balancers, databases'}, {'name': 'Address Bottlenecks', 'desc': 'Add caching, message queues, and replicas'}]}},
        quiz: [
            {
                question: "What is the primary difference between functional and non-functional requirements?",
                options: [
                    "Functional requirements specify what the system should do; non-functional requirements specify how the system behaves under constraints.",
                    "Functional requirements focus on scaling; non-functional requirements focus on features.",
                    "Functional requirements deal with security; non-functional requirements deal with databases.",
                    "There is no difference; they are interchangeable.",
                ],
                answer: 0,
                explanation: "Functional requirements describe core system actions/features (e.g., user login, sending messages). Non-functional requirements specify operational qualities (e.g., 99.99% availability, latency < 100ms)."
            },
            {
                question: "Which of the following is considered a 'Back-of-the-Envelope' estimation metric?",
                options: [
                    "Checking code coverage percentages",
                    "Calculating daily write storage volume based on DAU and average payload size",
                    "Counting the number of Git branches",
                    "Measuring CPU clock speed directly",
                ],
                answer: 1,
                explanation: "Back-of-the-envelope calculations estimate resources like network bandwidth, database storage, and cache memory required to support target traffic rates before architectural design begins."
            },
        ]
    },
    {
        id: "architecture-styles",
        title: "Architecture Styles",
        category: "Core Concepts",
        content: `
            <h1>Architecture Styles</h1>
            <p>Choosing the right architecture style is one of the most critical long-term decisions for any system. We will compare the four main paradigms: Monolith, Microservices, Serverless, and Event-Driven.</p>

            <h2>1. Monolithic Architecture</h2>
            <p>In a monolith, all software components of an application are packaged and deployed together as a single unit. The database is typically shared across all modules.</p>
            <div class="alert alert-note">
                <div class="alert-title">Pros & Cons of Monoliths</div>
                <strong>Pros:</strong> Simple to build, test, debug, and deploy. Low latency between components. Great for early-stage startups.<br>
                <strong>Cons:</strong> Difficult to scale modules independently, long build/deploy times, code coupling, single point of failure.
            </div>

            <!-- pagebreak -->
            <h2>2. Microservices Architecture</h2>
            <p>Microservices divide a large application into a collection of small, autonomous, and loosely coupled services. Each service represents a specific business capability, runs its own process, and manages its own database.</p>
            
            <div class="uml-text-box">
[Client] ---> [API Gateway]
                    |
      +-------------+-------------+
      |                           |
[Auth Service]            [Payment Service]
  (Auth DB)                  (Payment DB)
            </div>

            <div class="alert alert-warning">
                <div class="alert-title">Microservice Trade-offs & Strangler Fig Pattern</div>
                Migrating from a monolith to microservices should be done gradually. The **Strangler Fig Pattern** suggests replacing monolithic functionality step-by-step by placing an API Gateway in front, routing new or updated endpoints to microservices while routing the rest to the legacy monolith, eventually strangling the monolith out of existence.
            </div>

            <!-- pagebreak -->
            <h2>3. Serverless Architecture</h2>
            <p>Serverless (FaaS - Function as a Service) allows developers to write and run code without provisioning or managing underlying servers. Code runs in stateless ephemeral containers triggered by events (e.g., AWS Lambda, GCP Cloud Functions).</p>
            <ul>
                <li><strong>Scale-to-Zero:</strong> Pay only for resources consumed during function execution. No active request means no active costs.</li>
                <li><strong>Cold Starts:</strong> The latency spike that occurs when a serverless function is invoked after being idle, as the platform provisions new infrastructure containers.</li>
                <li><strong>Vendor Lock-in:</strong> Tight integration with cloud provider services makes migration difficult.</li>
            </ul>

            <!-- pagebreak -->
            <h2>4. Event-Driven Architecture (EDA)</h2>
            <p>In EDA, services communicate by publishing and consuming state changes called <strong>events</strong>. Producers emit events to an event broker (e.g., Kafka, RabbitMQ) without knowing who the consumers are. Consumers subscribe to topics asynchronously.</p>
            <p><strong>CQRS (Command Query Responsibility Segregation):</strong> Separates read and write operations. Writes (Commands) go to a transactional database, which emits events. A query processor reads these events to update a denormalized read-only search database (e.g. Elasticsearch) optimized for fast queries.</p>
                `,
        visualizer: {'type': 'monolith-vs-micro', 'title': 'Monolith vs Microservices Visualizer', 'desc': 'Toggle to see how database coupling changes between architecture patterns.'},
        quiz: [
            {
                question: "What is a database architecture best practice when migrating from a Monolith to Microservices?",
                options: [
                    "Keep a single global shared database for all services to read/write from directly.",
                    "Each microservice should manage and own its own private database, exposing data only via APIs.",
                    "Microservices should not use databases; they must keep state in memory.",
                    "Duplicate the entire database for each service.",
                ],
                answer: 1,
                explanation: "The 'Database per Service' pattern ensures services are loosely coupled. Directly sharing databases creates tight coupling, where a schema change in one service breaks other services."
            },
            {
                question: "What does the term 'Cold Start' refer to in Serverless architectures?",
                options: [
                    "The system freezing during deployment",
                    "The latency delay when a function is invoked for the first time or after being idle, because a new container must be provisioned",
                    "Servers running in cold climates to save energy",
                    "Running a query without indices",
                ],
                answer: 1,
                explanation: "Cold starts happen when a serverless function is called but no container is warm (active). The platform has to boot up a runtime environment, which introduces execution delay."
            },
        ]
    },
    {
        id: "uml-diagrams",
        title: "UML Diagrams",
        category: "Core Concepts",
        content: `
            <h1>UML Diagrams</h1>
            <p>Unified Modeling Language (UML) is a standardized modeling language consisting of an integrated set of diagrams, developed to help system architects specify, visualize, and document software systems.</p>

            <h2>1. Class Diagram (Structural)</h2>
            <p>Class diagrams describe the structure of a system by showing the system's classes, their attributes, operations (methods), and the relationships among objects.</p>
            <div class="uml-text-box">
+---------------------+
|       Customer      |
+---------------------+
| - id: String        |
| - email: String     |
+---------------------+
| + placeOrder(): void|
+---------------------+
           | 1
           |
           | *
+---------------------+
|        Order        |
+---------------------+
| - orderId: String   |
| - total: Double     |
+---------------------+
            </div>
            <p><strong>Relationship Types:</strong>
                <ul>
                    <li><strong>Association:</strong> Basic relationship where one object calls another.</li>
                    <li><strong>Aggregation (Empty Diamond):</strong> "Has-a" relationship where the child can exist independently of the parent (e.g., Department has Professors).</li>
                    <li><strong>Composition (Solid Diamond):</strong> "Part-of" relationship where the child cannot exist without the parent (e.g., House has Rooms).</li>
                </ul>
            </p>

            <!-- pagebreak -->
            <h2>2. Sequence Diagram (Behavioral/Interaction)</h2>
            <p>Sequence diagrams model the flow of logic and messages exchanged between system components over time. Time flows vertically down the diagram.</p>
            <div class="uml-text-box">
Client       Gateway       AuthService      Database
  |             |               |              |
  |--- login -->|               |              |
  |             |--- verify --->|              |
  |             |               |--- query --->|
  |             |               |<-- user -----|
  |             |<-- token -----|              |
  |<-- success -|               |              |
            </div>
            <p>It consists of lifelines (vertical dashed lines), activation bars (representing execution focus), and horizontal arrows mapping synchronous/asynchronous calls.</p>

            <!-- pagebreak -->
            <h2>3. Activity Diagram (Workflow)</h2>
            <p>Activity diagrams represent the step-by-step workflows of business and operational processes. They are dynamic flowcharts showing control flow.</p>
            <div class="uml-text-box">
 (*) -> [User Submits Cart] 
        -> [Check Stock]
        -> {Is Stock Available?}
           -> [Yes] -> [Charge Payment] -> [Ship Order] -> (*)
           -> [No]  -> [Show Error] -> (*)
            </div>
            <p>Features decision diamonds, fork bars (to split execution into parallel threads), and join bars (to merge parallel threads back into a single thread).</p>

            <!-- pagebreak -->
            <h2>4. Component Diagram (Implementation)</h2>
            <p>Component diagrams depict how software components are wired together to form larger subsystems. They highlight structural dependencies and interface implementations.</p>
            <div class="uml-text-box">
+------------------+          +-------------------+
|  OrderController | --(API)--> |   InventoryService|
+------------------+          +-------------------+
                                        |
                                        v
                               +------------------+
                               |   Database       |
                               +------------------+
            </div>
                `,
        visualizer: {'type': 'sequence-anim', 'title': 'Sequence Diagram Flow Visualizer', 'desc': 'Hover or click to execute the API call and watch messages propagate across UML lifelines.'},
        quiz: [
            {
                question: "Which UML diagram is best suited for demonstrating the step-by-step chronological exchange of messages between objects?",
                options: [
                    "Class Diagram",
                    "Component Diagram",
                    "Sequence Diagram",
                    "Use Case Diagram",
                ],
                answer: 2,
                explanation: "Sequence diagrams explicitly capture interactions over time, showing actors and components along with the chronological sequence of calls exchanged between them."
            },
        ]
    },
    {
        id: "system-diagrams",
        title: "Architecture & System Diagrams",
        category: "Core Concepts",
        content: `
            <h1>Architecture & System Diagrams</h1>
            <p>To design systems effectively, you need abstraction models. Standardizing how we draw boxes and lines prevents communication breakdowns. We will look at the C4 Model and Deployment Diagrams.</p>

            <h2>The C4 Model Structure</h2>
            <p>Created by Simon Brown, the C4 model is a lean graphical notation technique for modeling software architectures. It consists of four distinct levels of abstraction, mirroring a map zoom system:</p>

            <h3>Level 1: System Context Diagram</h3>
            <p>Shows the software system you are building, who uses it, and how it fits into the surrounding ecosystem. Detail is minimized; focus is on external actors and dependencies.</p>

            <!-- pagebreak -->
            <h3>Level 2: Container Diagram</h3>
            <p>Zooms into the system. A 'Container' represents a runnable application or data store (e.g., a React SPA, a Spring Boot backend API, a PostgreSQL database, or a Redis cache). It shows how these components divide responsibilities and communicate.</p>
            
            <div class="uml-text-box">
+--------------------------------------------------------------+
|                     System Boundary                          |
|                                                              |
|   +---------------+ (JSON/HTTPS) +------------------+        |
|   |  Web App SPA  | -----------> |   Backend API    |        |
|   +---------------+              +------------------+        |
|                                     /            \           |
|                                    v              v          |
|                             +----------+    +----------+     |
|                             | SQL DB   |    | Redis    |     |
|                             +----------+    +----------+     |
|                                                              |
+--------------------------------------------------------------+
            </div>

            <!-- pagebreak -->
            <h3>Level 3: Component Diagram</h3>
            <p>Zooms inside a single container (e.g., the Backend API) to show its internal logical components (e.g., SecurityController, OrderManager, EmailNotifier) and how they depend on each other.</p>

            <h3>Level 4: Code Diagram</h3>
            <p>Zooms into an individual component to show class hierarchies, interfaces, and function relationships (like a Class Diagram). Often auto-generated or omitted.</p>

            <!-- pagebreak -->
            <h2>Deployment Diagrams</h2>
            <p>Deployment diagrams show the physical configuration of run-time processing nodes and the software components that run on them. They specify cloud servers, regions, network bridges, subnets, and hardware nodes.</p>
            <p>For example, a typical deployment diagram maps out the AWS setup: traffic route from Route 53 to an Application Load Balancer (ALB) distributed across public subnets in Multi-AZ regions, calling EC2 instances inside private subnets, which write to a multi-region replicated Aurora DB.</p>
                `,
        visualizer: {'type': 'c4-zoom', 'title': 'Interactive C4 Zoom Model', 'desc': 'Click nodes to drill down from Context (Level 1) to Container (Level 2).'},
        quiz: [
            {
                question: "In the C4 Model, what does a 'Container' represent?",
                options: [
                    "A Docker container only",
                    "Any executable codebase, running service, or database storage unit (e.g. web browser, backend API, database)",
                    "A class method variable",
                    "A structural class diagram interface",
                ],
                answer: 1,
                explanation: "In C4 terminology, a container is not just a Docker container; it is any deployable and runnable subsystem, including frontend apps, databases, microservices, or mobile apps."
            },
        ]
    },
    {
        id: "cap-pacelc",
        title: "CAP Theorem & PACELC",
        category: "Core Concepts",
        content: `
            <h1>CAP Theorem & PACELC</h1>
            <p>In distributed systems, trade-offs are unavoidable. Two core models explain these boundaries: the CAP Theorem and its extension, PACELC.</p>

            <h2>1. The CAP Theorem</h2>
            <p>Formulated by Eric Brewer, CAP states that a distributed data store can simultaneously provide at most two of the following three guarantees:</p>
            <ul>
                <li><strong>Consistency (C):</strong> Every read receives the most recent write or an error.</li>
                <li><strong>Availability (A):</strong> Every non-failing node returns a non-error response (without guarantee that it contains the most recent write).</li>
                <li><strong>Partition Tolerance (P):</strong> The system continues to operate despite an arbitrary number of messages being dropped or delayed by the network between nodes.</li>
            </ul>

            <!-- pagebreak -->
            <div class="alert alert-important">
                <div class="alert-title">Choosing P is Mandatory!</div>
                Physical networks can always experience partitions (hardware faults, optical fiber cuts, routing errors). Therefore, you cannot choose CA. In system design, you must choose:
                <ul>
                    <li><strong>CP (Consistency & Partition Tolerance):</strong> Under partition, block writes and reads to preserve data accuracy. (e.g., HBase, MongoDB).</li>
                    <li><strong>AP (Availability & Partition Tolerance):</strong> Under partition, allow local updates, risking stale reads or split-brain. (e.g., Cassandra, DynamoDB).</li>
                </ul>
            </div>

            <!-- pagebreak -->
            <h2>2. The PACELC Theorem</h2>
            <p>CAP only describes behavior during a rare **network partition**. What happens during normal operations?</p>
            <p><strong>PACELC:</strong> If there is a <strong>P</strong>artition, trade-off <strong>A</strong>vailability or <strong>C</strong>onsistency; <strong>E</strong>lse, trade-off <strong>L</strong>atency or <strong>C</strong>onsistency.</p>
            <ul>
                <li><strong>PA/EL:</strong> Partition -> Availability. Else -> Latency (Fast over Consistent). Examples: Cassandra, DynamoDB.</li>
                <li><strong>PC/EC:</strong> Partition -> Consistency. Else -> Consistency (Consistent over Fast). Examples: Spanner, MySQL Cluster.</li>
            </ul>
                `,
        visualizer: {'type': 'cap-interactive', 'title': 'CAP Theorem Venn Diagram', 'desc': 'Hover over the regions to see system trade-offs.'},
        quiz: [
            {
                question: "Why is it practically impossible to build a CA (Consistent and Available) system in real cloud environments?",
                options: [
                    "Because consistency is slow.",
                    "Because network partitions are guaranteed to happen eventually due to physical infrastructure failures, forcing a choice between C and A.",
                    "Because cloud providers ban them.",
                    "Because database licenses do not support it.",
                ],
                answer: 1,
                explanation: "Network partition tolerance (P) is mandatory in real-world networking. If a partition occurs, a database must either reject queries to maintain Consistency (choosing CP) or accept potentially stale data to remain Available (choosing AP)."
            },
            {
                question: "What does the 'E' and 'L' in PACELC stand for?",
                options: [
                    "Encryption and Local Storage",
                    "Else and Latency",
                    "Engine and Locking",
                    "Elasticity and Logic",
                ],
                answer: 1,
                explanation: "PACELC states: If there is a Partition (P), trade off Availability (A) or Consistency (C); Else (E), trade off Latency (L) or Consistency (C)."
            },
        ]
    },
    {
        id: "load-balancing",
        title: "Load Balancing",
        category: "Core Concepts",
        content: `
            <h1>Load Balancing</h1>
            <p>Load balancers distribute incoming network traffic across a cluster of backend servers to ensure high availability, horizontal scaling, and reliability.</p>

            <h2>L4 vs L7 Load Balancing</h2>
            <ul>
                <li><strong>Layer 4 (Transport Layer):</strong> Routes traffic based on network info (IP address and TCP/UDP ports). Fast, doesn't decrypt HTTPS payloads, simple, low CPU overhead.</li>
                <li><strong>Layer 7 (Application Layer):</strong> Routes traffic based on application data (HTTP headers, cookies, URL paths like <code>/api/v1/checkout</code> vs <code>/static/images</code>). Decrypts SSL/TLS traffic, flexible, smart, requires more CPU resources.</li>
            </ul>

            <!-- pagebreak -->
            <h2>Routing Algorithms</h2>
            <ul>
                <li><strong>Round Robin:</strong> Cycles requests sequentially. Best when backend nodes have equal capacity.</li>
                <li><strong>Least Connections:</strong> Routes to the server with the fewest active sessions. Ideal for long-running connections (e.g. database sessions, file transfers).</li>
                <li><strong>IP Hash:</strong> Computes a hash of the client's IP to assign a backend server. Ensures session stickiness.</li>
                <li><strong>Weighted Round Robin:</strong> Assigns weights to servers based on hardware specs (e.g. Server A has 2x resources of Server B).</li>
            </ul>

            <!-- pagebreak -->
            <h2>Consistent Hashing</h2>
            <p>Traditional hashing (<code>server = hash(key) % N</code>) breaks down when scaling servers up or down because <code>N</code> changes, causing almost all keys to remap. Consistent Hashing maps keys and servers onto a circular ring, minimizing key migration when nodes are added or removed.</p>
            <p>To ensure uniform distribution of keys and avoid unbalanced node allocations, consistent hashing leverages **Virtual Nodes (Vnodes)**. Each physical server is assigned multiple virtual positions on the hash ring. This prevents hotspots by smoothing out key mappings across servers.</p>
                `,
        visualizer: {'type': 'load-balancer', 'title': 'Load Balancing Simulator', 'desc': "Click 'Route Request' to simulate traffic allocation across three backend nodes using Round Robin."},
        quiz: [
            {
                question: "What is the primary advantage of Layer 7 Load Balancing over Layer 4?",
                options: [
                    "Layer 7 is much faster because it does not inspect data.",
                    "Layer 7 can route requests based on specific HTTP paths, headers, cookies, or SSL session configurations.",
                    "Layer 7 only handles database connections.",
                    "Layer 7 operates directly on routers without operating system dependencies.",
                ],
                answer: 1,
                explanation: "Layer 7 operates at the application level. It can read HTTP packets, allowing routing decisions based on URL paths (e.g., redirecting /billing to a billing microservice) and cookies."
            },
            {
                question: "How does Consistent Hashing mitigate node additions or removals?",
                options: [
                    "By shutting down all nodes first",
                    "By mapping keys and nodes onto a hash ring, meaning only a fraction of keys (k/N) need to move when a node changes",
                    "By replacing SQL databases with NoSQL databases",
                    "By keeping a central lock on all data objects",
                ],
                answer: 1,
                explanation: "Consistent Hashing maps servers and objects to the same circular hash space. Adding or deleting a node only impacts keys located near that node on the circle, leaving the rest untouched."
            },
        ]
    },
    {
        id: "caching",
        title: "Caching — Redis & CDN",
        category: "Core Concepts",
        content: `
            <h1>Caching — Redis & CDN</h1>
            <p>Caching is one of the most effective strategies to scale systems. It involves storing copies of hot data in high-speed, volatile memory (like RAM) to serve reads faster.</p>

            <h2>1. Caching Strategies</h2>
            <table>
                <thead>
                    <tr>
                        <th>Strategy</th>
                        <th>Workflow</th>
                        <th>Pros & Cons</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Cache Aside</strong></td>
                        <td>App checks cache; if miss, reads from DB, updates cache, returns.</td>
                        <td>Simple. Cache only holds requested data. Misses are slow.</td>
                    </tr>
                    <tr>
                        <td><strong>Write Through</strong></td>
                        <td>App writes to cache; cache immediately writes to DB.</td>
                        <td>No stale cache. Higher write latency.</td>
                    </tr>
                    <tr>
                        <td><strong>Write Back (Behind)</strong></td>
                        <td>App writes to cache; cache writes asynchronously to DB in batches.</td>
                        <td>Super fast writes. Risk of data loss if cache crashes before DB write.</td>
                    </tr>
                </tbody>
            </table>

            <!-- pagebreak -->
            <h2>2. Cache Eviction Policies</h2>
            <p>Cache memory is limited. When full, data must be evicted using policies:</p>
            <ul>
                <li><strong>LRU (Least Recently Used):</strong> Evicts the items that haven't been accessed for the longest time.</li>
                <li><strong>LFU (Least Frequently Used):</strong> Evicts the items accessed the least number of times.</li>
                <li><strong>FIFO (First In First Out):</strong> Evicts the oldest items in the cache.</li>
            </ul>

            <!-- pagebreak -->
            <h2>3. Redis vs. CDN & Mitigating Cache Issues</h2>
            <ul>
                <li><strong>Redis (Remote Dictionary Server):</strong> In-memory key-value database. Used for caching database queries, session states, and API responses.</li>
                <li><strong>CDN (Content Delivery Network):</strong> Distributed network of edge proxy servers to cache static assets (HTML, CSS, JS, images, videos) close to end-users.</li>
            </ul>
            <h3>Cache Pitfalls & Mitigations:</h3>
            <ul>
                <li><strong>Cache Penetration:</strong> Requests for keys that do not exist hit the DB every time. *Mitigation:* Use Bloom Filters or cache empty values with a short TTL.</li>
                <li><strong>Cache Stampede:</strong> Multiple clients parallel-request a key when it expires, forcing multiple concurrent slow DB reads. *Mitigation:* Use mutex locks on cache misses.</li>
                <li><strong>Cache Avalanche:</strong> A mass expiration of keys at once overloads the DB. *Mitigation:* Inject random jitter to TTL durations.</li>
            </ul>
                `,
        visualizer: {'type': 'cache-lookup', 'title': 'Cache Aside Read Flow', 'desc': 'Request a user ID to trace the lookup route through the Cache and Database.'},
        quiz: [
            {
                question: "Which cache eviction policy discards the items that have not been read or written to for the longest duration?",
                options: [
                    "LFU (Least Frequently Used)",
                    "LRU (Least Recently Used)",
                    "FIFO (First In First Out)",
                    "TTL (Time to Live)",
                ],
                answer: 1,
                explanation: "LRU (Least Recently Used) tracks access sequences and discards the element that has gone unaccessed for the longest period when capacity limits are hit."
            },
            {
                question: "Under what circumstance would a 'Write-Back' caching strategy be preferred over 'Write-Through'?",
                options: [
                    "When write speeds are a massive bottleneck and minor data loss risk under crash is acceptable",
                    "When absolute consistency is required",
                    "When database storage is cheaper than cache storage",
                    "When writing only static images",
                ],
                answer: 0,
                explanation: "Write-back writes to cache first and responds immediately to the client, postponing DB commits to background batch tasks. This maximizes throughput but presents data loss risks during sudden outages."
            },
        ]
    },
    {
        id: "message-queues",
        title: "Message Queues — Kafka & RabbitMQ",
        category: "Data & Communication",
        content: `
            <h1>Message Queues — Kafka & RabbitMQ</h1>
            <p>Message queues facilitate asynchronous inter-service communication. They decouple producers from consumers, smoothing traffic surges and enhancing fault tolerance.</p>

            <h2>1. Queue Patterns</h2>
            <ul>
                <li><strong>Point-to-Point (Queue):</strong> One message is consumed by exactly one consumer. (e.g., job queues).</li>
                <li><strong>Publish/Subscribe (Topics):</strong> One message is broadcast to all consumers subscribed to the topic.</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. Kafka vs. RabbitMQ</h2>
            <table>
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>RabbitMQ</th>
                        <th>Apache Kafka</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Architecture</strong></td>
                        <td>Smart Broker, Dumb Consumer. Broker tracks message states.</td>
                        <td>Dumb Broker, Smart Consumer. Messages appended to a log; consumers track offsets.</td>
                    </tr>
                    <tr>
                        <td><strong>Message Retention</strong></td>
                        <td>Deleted immediately after delivery and acknowledgment.</td>
                        <td>Persisted to disk for a configured retention period (durable log).</td>
                    </tr>
                    <tr>
                        <td><strong>Use Case</strong></td>
                        <td>Complex routing (Exchanges like Direct, Fanout, Topic, Headers), transactions, standard task queues.</td>
                        <td>High throughput event streaming, log aggregation, real-time analytics.</td>
                    </tr>
                    <tr>
                        <td><strong>Throughput</strong></td>
                        <td>Moderate (~tens of thousands/sec)</td>
                        <td>Massive (~millions/sec)</td>
                    </tr>
                </tbody>
            </table>

            <!-- pagebreak -->
            <div class="alert alert-note">
                <div class="alert-title">Decoupling Example</div>
                When a user places an order: the Order Service writes to the DB and publishes an <code>order-placed</code> event to a message queue. The Notification Service and Inventory Service consume this message independently. If the Notification Service crashes, the message remains safely in the queue until it boots back up.
            </div>
                `,
        visualizer: {'type': 'message-queue', 'title': 'Decoupled Event Flow Simulator', 'desc': "Click 'Publish Event' to see how a producer decoupled from consumers queues tasks safely."},
        quiz: [
            {
                question: "Why is Apache Kafka able to scale to millions of messages per second compared to traditional brokers like RabbitMQ?",
                options: [
                    "It processes messages in memory only and never saves to disk.",
                    "It utilizes an append-only commit log on disk and delegates message state tracking (offsets) to the consumers instead of the broker.",
                    "It runs on specialized hardware routers.",
                    "It does not support multiple consumers.",
                ],
                answer: 1,
                explanation: "Kafka keeps broker processes simple by treating topics as partition logs on disk. Consumers keep track of their own progress (offsets), eliminating heavy read/write lock book-keeping inside the broker."
            },
        ]
    },
    {
        id: "api-design",
        title: "API Design — REST, GraphQL & gRPC",
        category: "Data & Communication",
        content: `
            <h1>API Design — REST, GraphQL & gRPC</h1>
            <p>API design dictates how client components request information from server components. Choosing the right API protocol determines network overhead, payload size, and development speed.</p>

            <h2>1. REST (Representational State Transfer)</h2>
            <p>REST is resource-centric and relies on HTTP methods (GET, POST, PUT, DELETE) and HTTP status codes. It enforces stateless server communications.</p>
            <ul>
                <li><strong>Over-fetching:</strong> Client receives more data than needed (e.g. requesting user name returns address, bio, and billing info).</li>
                <li><strong>Under-fetching:</strong> Client has to make multiple API calls to fetch associated data (e.g. get posts, then get comments for each post).</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. GraphQL</h2>
            <p>GraphQL is a query language for APIs. It uses a single endpoint (typically <code>POST /graphql</code>) and allows the client to define the exact shape of the response payload, resolving over-fetching and under-fetching.</p>
            <p>However, GraphQL can lead to the **N+1 query problem** on the server if resolvers fetch associated database entries one-by-one. Developers resolve this bottleneck using batching utilities like Facebook's **DataLoader**.</p>
            <pre><code># GraphQL Query Example
query {
  user(id: "1") {
    name
    email
  }
}</code></pre>

            <!-- pagebreak -->
            <h2>3. gRPC (Remote Procedure Call)</h2>
            <p>Developed by Google, gRPC is an open-source high-performance RPC framework. It runs on top of <strong>HTTP/2</strong> (supporting bi-directional streaming and multiplexing) and uses <strong>Protocol Buffers (Protobuf)</strong> as its binary serialization format.</p>
            <p>gRPC supports four streaming models: Unary (standard request/response), Server Streaming, Client Streaming, and Bidirectional Streaming. It is ideal for low-latency, high-performance **inter-microservice communication** where static typing and compact binary payloads are essential. REST remains dominant for public-facing client-to-server endpoints.</p>
                `,
        visualizer: {'type': 'api-comparison', 'title': 'API Payload Size Tester', 'desc': 'Compare network package sizes between XML, JSON (REST), and Protobuf (gRPC).'},
        quiz: [
            {
                question: "Which technology does gRPC leverage for binary serialization and interface definition?",
                options: [
                    "JSON (JavaScript Object Notation)",
                    "XML Schema definitions",
                    "Protocol Buffers (Protobuf)",
                    "GraphQL schemas",
                ],
                answer: 2,
                explanation: "gRPC uses Protocol Buffers (.proto files) to define message structures and service methods, compiling them into fast, language-agnostic binary serialization code."
            },
            {
                question: "What is a main problem solved by GraphQL compared to REST?",
                options: [
                    "Lack of database drivers",
                    "CORS security policies",
                    "Over-fetching and under-fetching of API fields by letting the client request exactly what it needs",
                    "High CPU usage on servers",
                ],
                answer: 2,
                explanation: "GraphQL allows client queries to specify fields (e.g. only name and ID), preventing the server from transmitting excess fields (over-fetching) or requiring multiple API hops (under-fetching)."
            },
        ]
    },
    {
        id: "database-design",
        title: "Database Design, Indexing & Sharding",
        category: "Data & Communication",
        content: `
            <h1>Database Design, Indexing & Sharding</h1>
            <p>A system's limits are often dictated by its database. We must master schemas, index mechanisms, and partition strategies.</p>

            <h2>1. Relational (SQL) vs. Non-Relational (NoSQL)</h2>
            <ul>
                <li><strong>SQL Databases:</strong> Structured, schema-enforced, support ACID transactions, relationships mapped with foreign keys. Great for transactional systems (e.g., banking, orders). *Examples: PostgreSQL, MySQL.*</li>
                <li><strong>NoSQL Databases:</strong> Dynamic schema, scale horizontally easily, key-value, document, column-family, or graph models. Great for unstructured data or massive scale. *Examples: MongoDB, Cassandra, DynamoDB.*</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. Database Indexing: B+ Trees vs. LSM Trees</h2>
            <p>Indexes speed up query read operations at the cost of slower write speeds and extra storage. The two primary index data structures are:</p>
            <ul>
                <li><strong>B-Trees (B+ Trees):</strong> Self-balancing tree structures. Keep data sorted, allowing logarithmic search, insertions, and range queries. B+ Trees keep keys only in leaf nodes, linking leaves sequentially for fast scans. Used by Relational DBs.</li>
                <li><strong>LSM-Trees (Log-Structured Merge-Trees):</strong> Optimize write performance by appending writes to an in-memory buffer (MemTable) and flushing them sequentially to sorted disk logs (SSTables). Compaction runs in the background. Used by Cassandra, RocksDB.</li>
            </ul>

            <!-- pagebreak -->
            <h2>3. Database Sharding (Horizontal Partitioning)</h2>
            <p>Sharding breaks a large database table into smaller pieces (shards) distributed across multiple database servers.</p>
            <ul>
                <li><strong>Horizontal Partitioning:</strong> Splitting table rows into multiple databases.</li>
                <li><strong>Vertical Partitioning:</strong> Splitting table columns into separate tables (e.g. moving heavy blob text columns to a separate table).</li>
                <li><strong>Sharding Keys:</strong> The attribute used to route queries (e.g. <code>user_id</code>). Choosing a poor shard key can lead to "hotspots" (unbalanced load on one server). Re-sharding when clusters grow is complex and requires consistent hashing or directory routing.</li>
            </ul>
                `,
        visualizer: {'type': 'sharding-calc', 'title': 'Database Sharding Router', 'desc': 'Enter a User ID to see which Database Shard the request is routed to using Hash Sharding (hash % 3).'},
        quiz: [
            {
                question: "What is the trade-off of adding database indexes to tables?",
                options: [
                    "Faster reads, but slower writes and increased storage consumption",
                    "Faster writes, but slower reads",
                    "Indexes make queries slower but secure",
                    "There are no trade-offs; they should be added on every column",
                ],
                answer: 0,
                explanation: "Indexes speed up SELECT queries. However, whenever a row is inserted, updated, or deleted, the index structures (e.g., B-Trees) must be recalculated, slowing down writes."
            },
            {
                question: "What is a 'hotspot' in database sharding?",
                options: [
                    "A server running physically hot in a data center",
                    "A shard that receives a disproportionate amount of read/write traffic due to an uneven sharding key distribution",
                    "An indexing error in B-Trees",
                    "A backup database takeover",
                ],
                answer: 1,
                explanation: "If you shard users by country, and 90% of users are in the US, the US shard will handle almost all traffic. This imbalance is called a hotspot and is solved by choosing a high-cardinality shard key (like UUID)."
            },
        ]
    },
    {
        id: "high-availability",
        title: "High Availability & Disaster Recovery",
        category: "Specialized Topics",
        content: `
            <h1>High Availability & Disaster Recovery</h1>
            <p>High Availability (HA) ensures a system remains operational and accessible, even during component failures. Disaster Recovery (DR) describes plans to restore system operations after a catastrophic event.</p>

            <h2>1. Measuring Availability (The 'Nines')</h2>
            <ul>
                <li><strong>99.9% (Three Nines):</strong> ~8.76 hours of downtime per year.</li>
                <li><strong>99.99% (Four Nines):</strong> ~52.56 minutes of downtime per year.</li>
                <li><strong>99.999% (Five Nines):</strong> ~5.26 minutes of downtime per year. (High-Availability standard).</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. Redundancy Patterns & Replication Lag</h2>
            <ul>
                <li><strong>Active-Passive (Failover):</strong> One active node serves traffic; passive nodes replicate data. If the active node dies, a heartbeat detector triggers a failover, promoting a passive node.
                    <ul>
                        <li>*Synchronous replication:* Primary waits for replica ack. Ensures no data loss, but writes are slow.</li>
                        <li>*Asynchronous replication:* Primary writes and immediately responds to client. Fast, but risks data loss during sudden failover.</li>
                    </ul>
                </li>
                <li><strong>Active-Active:</strong> Multiple nodes serve traffic simultaneously. If one node dies, load balancers stop routing traffic to it.</li>
            </ul>

            <!-- pagebreak -->
            <h2>3. DR Metrics: RPO and RTO</h2>
            <div class="uml-text-box">
[Disaster Event]
       |
       |<-- RPO (Recovery Point Objective) -- [Last Backup]
       |
       |--> RTO (Recovery Time Objective) --- [System Back Online]
            </div>
            <ul>
                <li><strong>RPO (Recovery Point Objective):</strong> The maximum acceptable age of data that can be lost due to an outage. Dictates backup frequency.</li>
                <li><strong>RTO (Recovery Time Objective):</strong> The maximum acceptable duration of downtime before system recovery. Dictates architecture redundancy.</li>
            </ul>
                `,
        visualizer: {'type': 'active-passive', 'title': 'Active-Passive Failover Simulation', 'desc': "Click 'Simulate Server Crash' to watch a heartbeat monitor detect active server loss and promote the standby replica."},
        quiz: [
            {
                question: "If a company has a Recovery Point Objective (RPO) of 1 hour, what does this imply?",
                options: [
                    "The system must be restored to service within 1 hour of a crash.",
                    "The database backups must be performed at least every hour to avoid losing more than 1 hour of transactions.",
                    "The servers must have 99.9% availability.",
                    "The network latency must be less than 1 hour.",
                ],
                answer: 1,
                explanation: "RPO represents the acceptable amount of data loss measured in time. An RPO of 1 hour means you must perform backups at intervals no greater than 1 hour, so you can restore to a point within 1 hour of the crash."
            },
        ]
    },
    {
        id: "design-patterns",
        title: "Design Patterns",
        category: "Specialized Topics",
        content: `
            <h1>Design Patterns</h1>
            <p>Design patterns are standardized reusable solutions to common problems in software engineering. They are categorized into Creational, Structural, and Behavioral patterns.</p>

            <h2>1. Creational Patterns (Object Creation)</h2>
            <ul>
                <li><strong>Singleton:</strong> Ensures a class has only one instance and provides a global access point to it (e.g., database connection pool, logger).</li>
                <li><strong>Factory Method:</strong> Provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects created.</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. Structural Patterns (Relationships between entities)</h2>
            <ul>
                <li><strong>Adapter:</strong> Allows objects with incompatible interfaces to collaborate. Acts as a translator.</li>
                <li><strong>Proxy:</strong> Provides a placeholder or surrogate object to control access to the original object (e.g., security gate, lazy loading, caching proxy).</li>
            </ul>

            <!-- pagebreak -->
            <h2>3. Behavioral Patterns (Object Collaboration)</h2>
            <ul>
                <li><strong>Observer (Pub/Sub):</strong> Defines a subscription mechanism to notify multiple observer objects of any events that happen to the subject they are observing.</li>
                <li><strong>Strategy:</strong> Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Let the algorithm vary independently of clients.</li>
            </ul>

            <div class="alert alert-note">
                <div class="alert-title">Code Example: Strategy Pattern (pseudo-code)</div>
                <pre><code>interface PaymentStrategy {
    void pay(int amount);
}
class StripePayment implements PaymentStrategy { ... }
class PayPalPayment implements PaymentStrategy { ... }

class OrderProcessor {
    private PaymentStrategy strategy;
    public void setStrategy(PaymentStrategy s) { this.strategy = s; }
    public void process(int amount) { strategy.pay(amount); }
}</code></pre>
            </div>
                `,
        visualizer: {'type': 'observer-pattern', 'title': 'Observer Pattern Visualizer', 'desc': "Click 'Emit Event' to trigger the Subject and watch all registered Observers execute updates simultaneously."},
        quiz: [
            {
                question: "Which design pattern is best suited for notifying multiple dependent services dynamically whenever an internal state change occurs in a core service?",
                options: [
                    "Singleton Pattern",
                    "Observer Pattern",
                    "Adapter Pattern",
                    "Factory Pattern",
                ],
                answer: 1,
                explanation: "The Observer pattern establishes a one-to-many relationship where a subject notifies all registered observers of updates asynchronously, maintaining loose coupling."
            },
        ]
    },
    {
        id: "security-architecture",
        title: "Security Architecture",
        category: "Specialized Topics",
        content: `
            <h1>Security Architecture</h1>
            <p>Security is not an add-on; it must be designed into the architecture from day one. We cover Auth, Network Security, and OWASP fundamentals.</p>

            <h2>1. Authentication vs. Authorization</h2>
            <ul>
                <li><strong>Authentication (AuthN):</strong> Verifying **who** a user is (e.g. passwords, biometrics, MFA, SSO tokens).</li>
                <li><strong>Authorization (AuthZ):</strong> Verifying **what** permissions they have (e.g. RBAC - Role Based Access Control, ABAC - Attribute Based Access Control).</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. Modern Token Protocols: JWT & OAuth2</h2>
            <p><strong>JSON Web Token (JWT):</strong> Stateless credentials containing signed JSON claims (e.g., user ID, roles). Self-contained, but impossible to revoke before expiration without blacklist databases (usually stored in Redis for instant revocation checks).</p>
            <p><strong>OAuth 2.0:</strong> An industry-standard delegation framework that allows client applications to obtain limited access to user accounts on an HTTP service (e.g. "Login with Google").</p>

            <!-- pagebreak -->
            <h2>3. Network Security Boundaries & Rate Limiting</h2>
            <ul>
                <li><strong>TLS/HTTPS:</strong> Encrypts data in transit to prevent Man-in-the-Middle (MitM) attacks.</li>
                <li><strong>WAF (Web Application Firewall):</strong> Filters, monitors, and blocks HTTP traffic to and from a web application (blocks SQL injections, XSS, and botnets).</li>
                <li><strong>Rate Limiting Algorithms:</strong> Prevents DoS attacks. Typical algorithms include:
                    <ul>
                        <li>*Token Bucket:* Tokens are added to a bucket at a constant rate. Requests consume tokens. Handles bursts.</li>
                        <li>*Leaky Bucket:* Requests enter a queue and leak out at a constant, smooth rate. Smooths outbound traffic.</li>
                    </ul>
                </li>
            </ul>
                `,
        visualizer: {'type': 'jwt-visualizer', 'title': 'JWT Structure Viewer', 'desc': 'Hover over the color-coded parts of a JWT token to inspect the Header, Payload, and Signature components.'},
        quiz: [
            {
                question: "What is a main security limitation of using stateless JSON Web Tokens (JWT) for user sessions?",
                options: [
                    "They cannot store user data.",
                    "They are difficult to revoke instantly before their scheduled expiration time without keeping a central token blacklist.",
                    "They do not work on mobile phones.",
                    "They require database calls to verify signatures.",
                ],
                answer: 1,
                explanation: "Because JWTs are stateless and self-contained, a server verifies them by signature alone. If a token is stolen, it remains valid until its expiration (TTL) unless a revoking database mechanism is built."
            },
        ]
    },
    {
        id: "cloud-architecture",
        title: "Cloud Architecture — AWS, GCP & Azure",
        category: "Specialized Topics",
        content: `
            <h1>Cloud Architecture — AWS, GCP & Azure</h1>
            <p>Modern applications are rarely built on bare metal. Understanding the mapping of core infrastructure services across major cloud providers (AWS, GCP, Azure, and Firebase) is key to cloud-native systems design.</p>

            <h2>Infrastructure Service Mapping</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service Type</th>
                        <th>AWS</th>
                        <th>GCP</th>
                        <th>Azure</th>
                        <th>Firebase</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Compute (VMs)</strong></td>
                        <td>EC2</td>
                        <td>Compute Engine</td>
                        <td>Virtual Machines</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>Serverless Functions</strong></td>
                        <td>Lambda</td>
                        <td>Cloud Functions</td>
                        <td>Azure Functions</td>
                        <td>Cloud Functions</td>
                    </tr>
                    <tr>
                        <td><strong>Managed SQL DB</strong></td>
                        <td>RDS / Aurora</td>
                        <td>Cloud SQL / Spanner</td>
                        <td>Azure SQL Database</td>
                        <td>-</td>
                    </tr>
                    <tr>
                        <td><strong>NoSQL DB</strong></td>
                        <td>DynamoDB</td>
                        <td>Firestore / Bigtable</td>
                        <td>Cosmos DB</td>
                        <td>Firestore / Realtime DB</td>
                    </tr>
                    <tr>
                        <td><strong>Object Storage</strong></td>
                        <td>S3</td>
                        <td>Cloud Storage</td>
                        <td>Blob Storage</td>
                        <td>Cloud Storage</td>
                    </tr>
                    <tr>
                        <td><strong>Message Broker</strong></td>
                        <td>SQS / SNS / Kinesis</td>
                        <td>Pub/Sub</td>
                        <td>Service Bus / Event Hubs</td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>

            <!-- pagebreak -->
            <h2>Key Cloud Abstractions</h2>
            <ul>
                <li><strong>Regions & Availability Zones:</strong> A **Region** is a geographic area. An **Availability Zone (AZ)** is one or more discrete data centers with redundant power, networking, and connectivity within a Region. Designing for HA requires deploying services across multiple AZs.</li>
                <li><strong>Auto-Scaling Group:</strong> Automatically adjusts the number of compute instances up or down based on load metrics (e.g. CPU > 70%).</li>
                <li><strong>VPC (Virtual Private Cloud):</strong> Isolated virtual network space in the cloud, split into public subnets (routing to Internet Gateways) and private subnets (no direct ingress, using NAT gateways for egress).</li>
            </ul>
                `,
        visualizer: {'type': 'cloud-calculator', 'title': 'Multi-Cloud Mapper', 'desc': 'Select a resource category to quickly cross-map its product equivalent across cloud suites.'},
        quiz: [
            {
                question: "What is the difference between an Availability Zone (AZ) and a Region?",
                options: [
                    "A Region is a single data center; an AZ is a collection of countries.",
                    "An AZ is a physical data center setup within a Region, while a Region is a geographic collection of multiple, isolated AZs.",
                    "AZs are only for databases; Regions are for VMs.",
                    "They mean the same thing.",
                ],
                answer: 1,
                explanation: "Regions represent separate geographical locations (e.g., US-East-1). Within each Region, cloud providers run multiple isolated data centers called Availability Zones (AZs) connected with fiber to support failover."
            },
        ]
    },
    {
        id: "case-studies",
        title: "System Design Case Studies",
        category: "Real-World Systems",
        content: `
            <h1>System Design Case Studies</h1>
            <p>Let's study the architecture diagrams and strategies used by major tech platforms to solve extreme scale problems.</p>

            <h2>1. Facebook: News Feed Architecture</h2>
            <p><strong>Challenge:</strong> Generate news feeds for billions of users with microsecond delivery.</p>
            <ul>
                <li><strong>Fan-out-on-Write (Push):</strong> When a user posts, prepend the post ID to the home feeds of all their followers in-memory. Great for users with low follower counts.</li>
                <li><strong>Fan-out-on-Read (Pull):</strong> For celebrity/famous accounts, followers pull the celebrity's posts on-demand and merge them with their feed. Prevents "write amplification" bottlenecks.</li>
                <li><strong>Graph Store (TAO):</strong> Facebook's custom write-through cache distributed globally to map social graph nodes (users, pages) and edges (likes, friendships).</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. YouTube: High-Scale Video Delivery</h2>
            <p><strong>Challenge:</strong> Processing huge video uploads and serving them with minimum buffering globally.</p>
            <ul>
                <li><strong>Transcoding Pipeline:</strong> Uploaded video files are split into small chunks and transcoded in parallel into multiple formats (MP4, WebM) and resolutions (360p, 1080p, 4K) using a queue-driven worker pool.</li>
                <li><strong>CDN Edge Optimization:</strong> Dynamic caching of popular videos closer to users, using ISP colocation servers.</li>
            </ul>

            <!-- pagebreak -->
            <h2>3. Uber: Real-time Dispatch</h2>
            <p><strong>Challenge:</strong> Match passengers with nearby drivers in real-time, matching coordinates 1-to-1.</p>
            <ul>
                <li><strong>Geospatial Indexing (H3/S2):</strong> Divides the map of the earth into hierarchical hexagonal (H3) or quadkey (S2) cells. Active driver locations are updated continuously to in-memory index maps, allowing rapid proximity queries.</li>
            </ul>

            <!-- pagebreak -->
            <h2>4. WhatsApp: Million-Connection Chat</h2>
            <p><strong>Challenge:</strong> Keeping websocket channels open for millions of concurrent active chats.</p>
            <ul>
                <li><strong>Erlang/OTP:</strong> Built on Erlang for lightweight processes and concurrency, letting a single node run millions of active connection threads.</li>
            </ul>

            <!-- pagebreak -->
            <h2>5. Netflix: Resilient Global Streaming</h2>
            <p><strong>Challenge:</strong> Handle 15%+ of global internet bandwidth without downtime.</p>
            <ul>
                <li><strong>Open Connect CDN:</strong> Custom appliance boxes installed inside ISP networks to cache and serve heavy video streams without touching transit backbones.</li>
                <li><strong>Chaos Engineering:</strong> Intentionally tearing down production systems (using Chaos Monkey) to ensure the system degrades gracefully without breaking the stream.</li>
            </ul>
                `,
        visualizer: {'type': 'case-studies-selector', 'title': 'Case Study Architecture Blueprint', 'desc': 'Select a company to load their high-level system design flow.'},
        quiz: [
            {
                question: "In feed generation architectures (like Facebook or Twitter), why is a hybrid approach (Push + Pull) used?",
                options: [
                    "To prevent writing to disk.",
                    "Because pushing posts from celebrity accounts with millions of followers would crash systems due to write amplification (fan-out bottleneck), so followers pull celebrity posts on-demand instead.",
                    "To support old browsers.",
                    "Because SQL databases cannot run joins.",
                ],
                answer: 1,
                explanation: "If a user has 80 million followers, posting a tweet requires writing 80 million feed logs (Fan-out-on-write). This crashes database clusters. A hybrid model pulls celebrity data on-demand (Fan-out-on-read) and merges it."
            },
        ]
    },
    {
        id: "monitoring-observability",
        title: "Monitoring, Observability & Alerting",
        category: "Infrastructure & Cloud",
        content: `
            <h1>Monitoring, Observability & Alerting</h1>
            <p>At scale, systems fail. When they do, SREs (Site Reliability Engineers) need visibility to detect, debug, and resolve issues before they impact customers.</p>

            <h2>1. The Three Pillars of Observability</h2>
            <p>Observability is the measure of how well internal states of a system can be inferred from its external outputs (telemetry data):</p>
            <ul>
                <li><strong>Metrics:</strong> Numeric measurements aggregated over time (e.g. CPU usage, request count, latency percentiles p99). Extremely cheap to store and query.</li>
                <li><strong>Logs:</strong> Structured timestamped text events generated by applications (e.g. JSON log containing error stack traces). Expensive to store and search.</li>
                <li><strong>Traces:</strong> End-to-end request lifecycle records showing paths and latencies across multiple microservices (using trace IDs and span IDs). Key for debugging distributed systems.</li>
            </ul>

            <!-- pagebreak -->
            <h2>2. Prometheus & Push vs Pull Metrics</h2>
            <p>There are two primary paradigms for gathering metrics from application servers:</p>
            <ul>
                <li><strong>Pull Model (e.g. Prometheus):</strong> The monitoring server scrapes metrics from HTTP endpoints (like <code>/metrics</code>) exposed by the applications at regular intervals. Simple, targets self-discovery, prevents DDoS on server.</li>
                <li><strong>Push Model (e.g. InfluxDB, CloudWatch):</strong> Application agents push telemetry metrics directly to a central collector. Ideal for short-lived ephemeral tasks (like AWS Lambda functions).</li>
            </ul>

            <!-- pagebreak -->
            <h2>3. Distributed Tracing (Jaeger & OpenTelemetry)</h2>
            <p>When a client calls a microservices system, a single request can touch 20 separate services. If it is slow, how do we find the bottleneck? Distributed tracing tags each request with a unique <strong>Trace ID</strong> at the gateway, passing it down headers. Each component adds its own timed segment called a <strong>Span ID</strong>.</p>
            
            <div class="uml-text-box">
Trace ID: 0x9f2a (Total: 400ms)
+---------------------------------------------+
| Gateway (Span A) [0ms - 400ms]              |
+---------------------------------------------+
   \--+-------------------------------+
      | AuthSrv (Span B) [5ms - 55ms] |
      +-------------------------------+
   \--+--------------------------------------+
      | OrderSrv (Span C) [60ms - 390ms]      |
      +---------------------------------------+
         \--+------------------------+
            | DB Query (Span D)      |
            | [80ms - 380ms]         |
            +------------------------+
            </div>

            <!-- pagebreak -->
            <h2>4. Alerting & SLI/SLO/SLA</h2>
            <p>Observability data is useless without a structured alerting framework to page on-call engineers.</p>
            <ul>
                <li><strong>SLI (Service Level Indicator):</strong> The quantitative measure of service performance (e.g. Latency of successful calls < 200ms).</li>
                <li><strong>SLO (Service Level Objective):</strong> The target reliability goal agreed upon by product teams (e.g. 99% of successful requests must have latency < 200ms over 30 days).</li>
                <li><strong>SLA (Service Level Agreement):</strong> The legal/business contract with customers defining penalties if the SLO is breached (e.g. 99.9% availability or customers get 10% refund).</li>
            </ul>
                `,
        visualizer: {'type': 'observability-flow', 'title': 'Observability & Alerting Dashboard', 'desc': 'Simulate load spikes and watch metrics, logs, and distributed traces respond in real-time.'},
        quiz: [
            {
                question: "What are the three pillars of observability in distributed systems?",
                options: [
                    "Security, Speed, and Stability",
                    "SQL, NoSQL, and NewSQL",
                    "Metrics, Logs, and Distributed Traces",
                    "Load Balancers, Caches, and Message Queues",
                ],
                answer: 2,
                explanation: "Metrics, Logs, and Distributed Traces are the three core telemetry types that give developers and SREs deep visibility into active system state and execution bottlenecks."
            },
            {
                question: "What is the difference between an SLI and an SLO?",
                options: [
                    "An SLI is a legal contract, while an SLO is a technical metric.",
                    "An SLI is the actual quantitative measurement of a metric, whereas an SLO is the target objective for that indicator.",
                    "They are identical terms.",
                    "SLIs are for hardware; SLOs are for software.",
                ],
                answer: 1,
                explanation: "The SLI is the indicator (e.g., current error rate = 0.5%). The SLO is the objective target (e.g., error rate must remain < 1.0% over 30 days)."
            },
        ]
    }
];

const PROGRAMMING_LANGUAGE_LESSONS = [
    {
        id: "go",
        title: "Go (Golang)",
        category: "Backend & Systems",
        content: `
            <h1>Go (Golang) Masterclass</h1>
            <p>Created at Google, Go is a compiled, statically typed language designed for high-concurrency, simplicity, and compile-time speed. It is the language of cloud-native infrastructure (Docker, Kubernetes, and Terraform are all written in Go).</p>

            <h2>1. Basic: Syntax, Types & Control Flow</h2>
            <p>Go is simple, having only 25 keywords. Variables are declared with explicit types or using the short declaration operator (<code>:=</code>).</p>
            <pre><code>package main

import "fmt"

func main() {
    // Short declaration (type inferred)
    message := "Hello, Go!"
    fmt.Println(message)

    // Explicit variables
    var count int = 10
    if count > 5 {
        fmt.Println("Count is large")
    }

    // Loops: Go only has one loop keyword: 'for'
    for i := 0; i < 3; i++ {
        fmt.Println(i)
    }
}</code></pre>

            <!-- pagebreak -->
            <h2>2. Intermediate: Structs, Interfaces & Error Handling</h2>
            <p>Go does not have classes or classical inheritance. It uses **structs** for data encapsulation and **interfaces** for polymorphism. Interfaces are implemented **implicitly** (structural typing).</p>
            <pre><code>package main

import "fmt"

// Define a struct
type User struct {
    ID   int
    Name string
}

// Define an interface
type Stringer interface {
    ToString() string
}

// Implicitly implement Stringer on User struct
func (u User) ToString() string {
    return fmt.Sprintf("User #%d: %s", u.ID, u.Name)
}

func printItem(s Stringer) {
    fmt.Println(s.ToString())
}

// Error handling in Go is explicit; there are no exceptions
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}</code></pre>

            <!-- pagebreak -->
            <h2>3. Advanced: Concurrency (Goroutines & Channels)</h2>
            <p>Go's primary selling point is its concurrency model, based on **Communicating Sequential Processes (CSP)**.</p>
            <ul>
                <li><strong>Goroutines:</strong> Extremely lightweight threads managed by the Go runtime. Starting a goroutine costs only ~2KB of memory stack space. Prefix calls with the keyword <code>go</code>.</li>
                <li><strong>Channels:</strong> Pipes used to safely transfer data between goroutines, preventing race conditions.</li>
            </ul>
            <pre><code>package main

import (
    "fmt"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int) {
    for j := range jobs {
        fmt.Printf("worker %d starting job %d\\n", id, j)
        time.Sleep(time.Second) // simulate load
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 10)
    results := make(chan int, 10)

    // Spawn 3 worker goroutines
    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    // Send 5 jobs
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)

    // Collect results
    for a := 1; a <= 5; a++ {
        fmt.Println("Result:", <-results)
    }
}</code></pre>
        `,
        visualizer: {
            type: "go-concurrency",
            title: "Goroutines & Channels Simulation",
            desc: "Watch how jobs are sent via channels to multiple goroutine worker threads in parallel."
        },
        quiz: [
            {
                question: "How are interfaces implemented in Go?",
                options: [
                    "Using the 'implements' keyword explicitly.",
                    "Implicitly; a struct implements an interface simply by defining all methods declared in that interface.",
                    "Using structural inheritance annotations.",
                    "Go does not support interfaces."
                ],
                answer: 1,
                explanation: "Go interfaces are satisfied implicitly. Struct developers do not write 'implements MyInterface'. If a struct has the required method signatures, it can be assigned to the interface directly."
            },
            {
                question: "What is a major memory advantage of a Goroutine over an OS thread?",
                options: [
                    "Goroutines run directly in the CPU L1 cache.",
                    "OS threads take megabytes of initial stack memory, whereas a Goroutine starts with only 2KB of stack space.",
                    "Goroutines bypass memory allocations.",
                    "Goroutines only work on Linux servers."
                ],
                answer: 1,
                explanation: "OS threads have fixed stack sizes (e.g. 1MB-8MB). Goroutines start with a tiny 2KB dynamic stack that grows and shrinks as needed, enabling systems to run hundreds of thousands of concurrent goroutines."
            }
        ]
    },
    {
        id: "rust",
        title: "Rust",
        category: "Backend & Systems",
        content: `
            <h1>Rust Masterclass</h1>
            <p>Rust is a systems programming language designed for ultimate speed, concurrency, and memory safety without a garbage collector. It achieves safety through its unique **Ownership and Borrowing** model enforced at compile-time.</p>

            <h2>1. Basic: Variables, Patterns & Error Handling</h2>
            <p>Variables in Rust are immutable by default. Expressions return values, and pattern matching is exhaustive.</p>
            <pre><code>fn main() {
    let x = 5; // Immutable
    // x = 6; // Compile error!
    
    let mut y = 10; // Mutable
    y = 15; // OK
    
    // Pattern matching
    let number = 3;
    match number {
        1 => println!("One"),
        2 | 3 => println!("Two or Three"),
        _ => println!("Anything else!"),
    }
}</code></pre>

            <!-- pagebreak -->
            <h2>2. Intermediate: Structs, Enums & Traits</h2>
            <p>Rust uses <code>struct</code> to group data, <code>enum</code> to represent types that can be one of several variants (sum types), and <code>trait</code> to define shared behavior (interfaces).</p>
            <pre><code>// Sum type Enum containing data payloads
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

// Defining a Trait
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
    author: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }
}</code></pre>

            <!-- pagebreak -->
            <h2>3. Advanced: Ownership, Borrowing & Concurrency</h2>
            <p>Rust's compiler tracks memory safety using rules of ownership:</p>
            <ol>
                <li>Each value in Rust has an **owner**.</li>
                <li>There can only be **one owner** at a time.</li>
                <li>When the owner goes out of scope, the value is automatically dropped (RAII).</li>
            </ol>
            <p>You can reference data by **borrowing** it: either any number of immutable references (<code>&T</code>) OR exactly one mutable reference (<code>&mut T</code>) in a scope. This prevents **data races** at compile time.</p>
            <pre><code>fn main() {
    let s1 = String::from("hello"); // s1 owns the String
    
    let len = calculate_length(&s1); // Borrowing s1 immutably
    
    println!("The length of '{}' is {}.", s1, len); // s1 is still valid
    
    let mut s2 = String::from("hello");
    change_value(&mut s2); // Borrowing s2 mutably
}

fn calculate_length(s: &String) -> usize {
    s.len()
}

fn change_value(s: &mut String) {
    s.push_str(", world");
}</code></pre>
        `,
        visualizer: {
            type: "rust-borrowing",
            title: "Ownership & Borrowing Visualizer",
            desc: "Simulate compiling code and see if the borrow checker blocks data sharing or allows safe execution."
        },
        quiz: [
            {
                question: "What is Rust's borrow checker rule regarding references?",
                options: [
                    "You can have any number of mutable references at once.",
                    "You can have either one mutable reference OR any number of immutable references in a given scope, but never both.",
                    "References are only verified at runtime.",
                    "All variables must be cleaned with a Garbage Collector."
                ],
                answer: 1,
                explanation: "To prevent data races, Rust enforces that you can have multiple read-only views (immutable borrows) OR a single exclusive write view (mutable borrow), but they cannot coexist."
            }
        ]
    },
    {
        id: "typescript",
        title: "TypeScript",
        category: "Web & Fullstack",
        content: `
            <h1>TypeScript Masterclass</h1>
            <p>TypeScript is a strongly typed programming language that builds on JavaScript, giving you compile-time type safety. It transpiles to plain JavaScript and runs anywhere JS runs (Browsers, Node.js, Deno, Bun).</p>

            <h2>1. Basic: Typings & Interfaces</h2>
            <p>TypeScript adds type annotations to JavaScript parameters, return values, and objects.</p>
            <pre><code>// Simple types
let username: string = "jeric";
let age: number = 25;
let isActive: boolean = true;

// Type Interfaces
interface User {
    readonly id: number;
    name: string;
    email: string;
    phoneNumber?: string; // Optional field
}

const newUser: User = {
    id: 101,
    name: "Jeric Alcantara",
    email: "jericalcantara018@gmail.com"
};</code></pre>

            <!-- pagebreak -->
            <h2>2. Intermediate: Generics & Utility Types</h2>
            <p>Generics enable developers to create reusable code templates that operate on multiple types rather than a single one, while maintaining full type safety.</p>
            <pre><code>// Generic API response container
interface ApiResponse<T> {
    data: T;
    status: number;
    error?: string;
}

interface UserProfile {
    bio: string;
    avatarUrl: string;
}

// Fetch returns typed profile response
async function getProfile(id: number): Promise<ApiResponse<UserProfile>> {
    const res = await fetch(\`/api/user/\${id}/profile\`);
    return res.json();
}

// Utility Types
type PartialUser = Partial<User>; // Makes all User fields optional
type ReadonlyUser = Readonly<User>; // Makes all fields read-only</code></pre>

            <!-- pagebreak -->
            <h2>3. Advanced: Async Concurrency & Event Loops</h2>
            <p>JavaScript and TypeScript run on a single-threaded **Event Loop** using microtasks and macrotasks to support async executions without threading locks.</p>
            <pre><code>// Asynchronous promise workflow
async function processOrder(orderId: string): Promise<boolean> {
    try {
        console.log("Checking stock...");
        const inStock = await verifyInventory(orderId);
        if (!inStock) return false;
        
        console.log("Processing payment...");
        const paid = await executeTransaction(orderId);
        return paid;
    } catch (err) {
        console.error("Order processing failed:", err);
        return false;
    }
}</code></pre>
        `,
        visualizer: {
            type: "ts-eventloop",
            title: "JS/TS Event Loop Scheduler",
            desc: "Trigger Async Callbacks, Promises (Microtasks), and SetTimeouts (Macrotasks) to watch queue priorities in action."
        },
        quiz: [
            {
                question: "How does TypeScript differ from compiled languages like Rust or Go regarding runtime execution?",
                options: [
                    "TypeScript compiles directly to native machine code.",
                    "TypeScript has no runtime representation; it is stripped by the compiler, and only standard JavaScript executes in the browser or server.",
                    "TypeScript uses a compiler inside the browser at runtime.",
                    "TypeScript runs slower than JavaScript in the browser."
                ],
                answer: 1,
                explanation: "TypeScript is compile-time syntactic sugar. The compiler checks types and outputs plain JavaScript. The type definitions are fully stripped, meaning there is zero performance overhead at runtime."
            }
        ]
    },
    {
        id: "python",
        title: "Python",
        category: "Web & Fullstack",
        content: `
            <h1>Python Masterclass</h1>
            <p>Python is a high-level, interpreted programming language known for its readability, dynamic typing, and huge ecosystem. It is the dominant language for Data Science, Artificial Intelligence, scripting, and backend web APIs (Django, FastAPI).</p>

            <h2>1. Basic: Syntactic Elegance</h2>
            <p>Python uses indentation to define code blocks, emphasizing readable constructs.</p>
            <pre><code># Dynamic types, list comprehensions
names = ["jeric", "alice", "bob"]
capital_names = [name.upper() for name in names]
print(capital_names) # ['JERIC', 'ALICE', 'BOB']

# Dictionaries
user_map = {"id": 18, "role": "admin"}
for key, value in user_map.items():
    print(f"{key}: {value}")</code></pre>

            <!-- pagebreak -->
            <h2>2. Intermediate: Object Oriented & Decorators</h2>
            <p>Python supports full Object-Oriented Programming (OOP) and includes **decorators** (functions that modify the behavior of other functions).</p>
            <pre><code># Simple Decorator
def log_execution(func):
    def wrapper(*args, **kwargs):
        print(f"Executing: {func.__name__}")
        result = func(*args, **kwargs)
        print("Execution complete.")
        return result
    return wrapper

class DatabaseConnector:
    def __init__(self, dsn: str):
        self.dsn = dsn
        
    @log_execution
    def query(self, sql: str):
        return f"Executing {sql} against {self.dsn}"</code></pre>

            <!-- pagebreak -->
            <h2>3. Advanced: Concurrency & Asyncio</h2>
            <p>Python historically struggled with thread-based parallel CPU execution because of the **Global Interpreter Lock (GIL)**. For I/O bound workloads (like network APIs), Python utilizes modern async event loops via <code>asyncio</code>.</p>
            <pre><code>import asyncio

async def fetch_api_data(endpoint: str):
    print(f"Requesting {endpoint}...")
    await asyncio.sleep(2) # Simulates network latency (Non-blocking)
    print(f"Response from {endpoint} received!")
    return {"status": "success", "data": 200}

async def main():
    # Execute network requests concurrently
    results = await asyncio.gather(
        fetch_api_data("/users"),
        fetch_api_data("/orders"),
        fetch_api_data("/inventory")
    )
    print("All tasks completed!", results)

# Run the event loop
asyncio.run(main())</code></pre>
        `,
        visualizer: {
            type: "py-gil-visualizer",
            title: "Global Interpreter Lock (GIL) Visualizer",
            desc: "Watch how the GIL limits multiple Python threads from running CPU-bound calculations in parallel, forcing sequential thread scheduling."
        },
        quiz: [
            {
                question: "What is the Global Interpreter Lock (GIL) in Python?",
                options: [
                    "A security tool that blocks hacker logins.",
                    "A mutex lock that protects database connections.",
                    "A mechanism in the CPython interpreter that ensures only one thread executes Python bytecode at a time, preventing true CPU multi-core execution in multi-threaded programs.",
                    "An encryption lock for python scripts."
                ],
                answer: 2,
                explanation: "The GIL is a core design element of CPython (default python runtime). It prevents race conditions in memory management but limits CPU-bound multi-threaded execution. Real multi-core work in Python requires the 'multiprocessing' package instead of threads."
            }
        ]
    }
];

// ==========================================================================
// GLOSSARY DATA
// ==========================================================================

const GLOSSARY_ITEMS = [
    { term: "ACID", definition: "A set of properties (Atomicity, Consistency, Isolation, Durability) that guarantee database transactions are processed reliably, preserving financial and critical data states." },
    { term: "Active-Active", definition: "A system redundancy design where two or more nodes process traffic concurrently. If one goes down, the load balancer shifts all traffic to the active survivors." },
    { term: "Active-Passive", definition: "A redundancy model where only one node processes traffic. Passive standby nodes sync database logs and assume active duties during failover." },
    { term: "API Gateway", definition: "An entry-point server that routes client requests, performs auth verification, aggregates endpoint data, and controls rate limiting across internal microservices." },
    { term: "B-Tree", definition: "A self-balancing search tree structure designed to store sorted keys on disk, allowing fast logarithmic index queries. Found in relational databases." },
    { term: "Borrow Checker", definition: "A compiler sub-system in Rust that validates reference lifetimes, ensuring no data races, null pointers, or dangling references occur." },
    { term: "CDN", definition: "Content Delivery Network. A geographically distributed network of proxy nodes caching static files close to end-users to reduce bandwidth and network latency." },
    { term: "Cold Start", definition: "The latency delay occurring in serverless functions when a new container must be spun up and initialized to handle a request." },
    { term: "Consistent Hashing", definition: "A hash mapping strategy that maps keys and nodes onto a circular ring. Adding or removing nodes only relocates a small fraction of keys." },
    { term: "Database Sharding", definition: "A database partition strategy that splits table rows across multiple servers horizontally, using a sharding key to distribute load." },
    { term: "Event Loop", definition: "A loop execution mechanism that schedules async events, callbacks, and microtasks. Used by JavaScript, Node.js, and Python asyncio." },
    { term: "Failover", definition: "An automated recovery mechanism that redirects requests to backup servers or databases when a primary system component crashes." },
    { term: "FaaS", definition: "Function as a Service. A serverless execution model where developers deploy single functions triggered by event handlers, scaling automatically to zero." },
    { term: "GIL", definition: "Global Interpreter Lock. A mutex lock in CPython ensuring only one thread runs python bytecodes at a time, limiting CPU-bound thread parallelism." },
    { term: "Goroutine", definition: "A lightweight, user-space execution thread managed by the Go runtime, starting with only 2KB of dynamic stack memory." },
    { term: "gRPC", definition: "A high-performance remote procedure call framework running on HTTP/2 and using Protocol Buffers to serialize structured binary data." },
    { term: "Heartbeat", definition: "A periodic network message sent between nodes or monitors to notify that a node is alive and healthy. Triggers failover if it drops." },
    { term: "Horizontal Scaling", definition: "Adding more machine nodes to a pool (scaling out) to distribute system workload, as opposed to upgrading a single node (vertical scaling)." },
    { term: "LSM-Tree", definition: "Log-Structured Merge-Tree. A database indexing structure optimizing write speeds by buffering operations in memory and flushing sorted tables to disk." },
    { term: "Microservices", definition: "An architectural style structuring applications as a suite of small, autonomous, loosely coupled services communicating via APIs." },
    { term: "Monolith", definition: "An architecture where all software modules are bundled together in a single deployment package sharing a global database." },
    { term: "RPO", definition: "Recovery Point Objective. The maximum age of transaction records that can be lost due to an outage without causing business failure." },
    { term: "RTO", definition: "Recovery Time Objective. The maximum duration of downtime permitted to get a crashed system fully functional and online again." },
    { term: "TLS", definition: "Transport Layer Security. An encryption protocol securing communications over a computer network, preventing snooping and MitM attacks." },
    { term: "Write Amplification", definition: "An undesirable system behavior where a single user action triggers multiple backend write operations (e.g. posting to all followers' feeds)." },
    { term: "WAF", definition: "Web Application Firewall. A security filter sitting in front of web applications to detect and block malicious HTTP payloads (e.g., SQLi, XSS)." }
];

// ==========================================================================
// CHECKLIST / PLANNER ITEMS
// ==========================================================================

const PLANNER_CHECKLIST = [
    {
        category: "1. Requirements & Scaling Design",
        items: [
            { id: "req_functional", title: "Verify Functional Requirements", desc: "List core features the system must provide (e.g., user posts, comments, payments)." },
            { id: "req_non_functional", title: "Define Non-Functional Constraints", desc: "Target explicit SLAs (e.g. 99.9% availability, page load speed < 200ms, consistency tier)." },
            { id: "req_math", title: "Run Scale Estimations (Math)", desc: "Calculate bandwidth, storage footprints, write volume, and CPU limits based on daily active users (DAU)." }
        ]
    },
    {
        category: "2. API & Network Topology",
        items: [
            { id: "api_rest_grpc", title: "Select Interface Protocols", desc: "Use REST/GraphQL for clients, and choose gRPC for low-latency microservice-to-microservice traffic." },
            { id: "api_gateway", title: "Design Gateway Routing", desc: "Set up a gateway layer to manage SSL termination, rate limiting, and core auth translation." },
            { id: "net_load_balancing", title: "Configure Load Balancers", desc: "Deploy Layer 7 load balancers to balance HTTP traffic, and use Consistent Hashing for session-sensitive clusters." }
        ]
    },
    {
        category: "3. Database & Caching Architecture",
        items: [
            { id: "db_selection", title: "Analyze SQL vs NoSQL Choices", desc: "Select SQL for strict ACID transactions. Choose NoSQL document/key-value stores for elastic scalability." },
            { id: "db_indexing", title: "Optimize Table Indexes", desc: "Create indexes on tables for high-frequency queries. Use B+ Trees for ranges; avoid over-indexing to keep write rates high." },
            { id: "db_sharding", title: "Establish Sharding Plan", desc: "Implement sharding key mapping (e.g. hash of user_id) to split database rows horizontally without creating hotspots." },
            { id: "cache_aside", title: "Add App-Level Caching (Redis)", desc: "Adopt Cache-Aside for read-heavy operations, utilizing cache invalidation (TTL) to manage stale queries." },
            { id: "cache_cdn", title: "Set Up Static Asset CDN Edge", desc: "Cache images, code scripts, stylesheets, and multimedia files on geographical edge CDN endpoints." }
        ]
    },
    {
        category: "4. Asynchrony & Decoupling",
        items: [
            { id: "queue_decouple", title: "Decouple Write Operations with Message Queues", desc: "Send slow background tasks (e.g. email alerts, video transcoding, payment notifications) to Kafka or RabbitMQ." },
            { id: "queue_surges", title: "Queue-based Load Leveling", desc: "Protect downstream databases from spikes by buffer-writing requests through an asynchronous event broker." }
        ]
    },
    {
        category: "5. Availability & Recovery",
        items: [
            { id: "ha_redundancy", title: "Deploy Multi-AZ Redundancy", desc: "Eliminate Single Points of Failure by running servers across multiple availability zones and database read replicas." },
            { id: "dr_failover", title: "Automate Database Failovers", desc: "Configure Active-Passive cluster failovers, backing up database files to match your Recovery Point Objective (RPO)." }
        ]
    },
    {
        category: "6. System Security & Audit",
        items: [
            { id: "sec_tls", title: "Enforce TLS (HTTPS/gRPC Security)", desc: "Encrypt all communications in-transit. Do not allow raw HTTP fallback links." },
            { id: "sec_tokens", title: "Stateless Authentication (JWT)", desc: "Use signed JWTs for session tokens; establish token expiry bounds and secure cookie flags." },
            { id: "sec_firewall", title: "Filter Bad Input (WAF)", desc: "Protect backend inputs from XSS, SQL injections, and buffer overflows using sanitizers and firewalls." }
        ]
    }
];
