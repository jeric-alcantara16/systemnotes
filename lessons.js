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
    <h2>Scale Dimensions: Vertical vs. Horizontal</h2>
    <p>Scaling is the ability of a system to handle increasing load. When designing a system, we categorize scaling into two directions:</p>
    <ul>
        <li><strong>Vertical Scaling (Scale-Up):</strong> Adding more power (CPU, RAM, NVMe SSDs) to an existing server.
            <ul>
                <li><em>Pros:</em> Extremely simple. No application changes needed. Low latency since all processes run locally.</li>
                <li><em>Cons:</em> Hard hardware limit (you cannot buy an infinitely large CPU). No redundancy; if the single server fails, the system goes offline. Extremely expensive at higher specs.</li>
            </ul>
        </li>
        <li><strong>Horizontal Scaling (Scale-Out):</strong> Adding more servers to the pool.
            <ul>
                <li><em>Pros:</em> Infinite scaling potential. High redundancy and availability; if one server fails, load balancers route requests to the remaining nodes. Cost-effective (uses commodity hardware).</li>
                <li><em>Cons:</em> Introduces network latency. Requires stateless application layers. Requires complex data synchronization and consistency models (e.g. databases must be replicated/partitioned).</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Functional Requirements Elicitation</h2>
    <p>Functional requirements describe what the system must do. During a system design interview or engineering discovery phase, you must define the boundaries of your system by asking clarifying questions:</p>
    <ul>
        <li><strong>Who is using the system?</strong> (e.g., end-users, admin moderators, API clients).</li>
        <li><strong>What are the core features?</strong> For a chat application: Can users send direct messages? Can they create groups? Can they send media files (images/videos)? Do messages need to be persistent or ephemeral?</li>
        <li><strong>What is the system boundary?</strong> Clearly establish what is <em>in-scope</em> versus what is <em>out-of-scope</em>. For example, "User registration and password recovery are out-of-scope; we will assume users are pre-authenticated."</li>
    </ul>
    <p>Defining user scenarios as use cases ensures that your high-level architecture diagram has the correct microservices to handle every user action.</p>
    <!-- pagebreak -->
    <h2>Non-Functional Requirements (NFRs)</h2>
    <p>Non-functional requirements specify operational criteria rather than behaviors. They define how the system executes. Typical NFR targets:</p>
    <ul>
        <li><strong>Availability:</strong> The probability that the system is operational at any given time. Measured in "Nines" (e.g., 99.99%).</li>
        <li><strong>Latency:</strong> Response times measured at specific percentiles (p50, p95, p99, p99.9). For example, "p99 latency for API calls must be less than 200ms," meaning 99% of requests complete within 200ms.</li>
        <li><strong>Reliability:</strong> The probability that the system will perform its intended function without failure over a period of time. A reliable system does not lose data (high durability) and performs consistently.</li>
        <li><strong>Scalability:</strong> The capability of the system to handle increasing traffic rates gracefully (e.g., handling 10x traffic with proportional resource additions).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Back-of-the-Envelope Estimation: Math & Formulas</h2>
    <p>Estimation math helps you estimate database storage sizes, network bandwidth, memory capacity, and CPU limits before building the system. Memorize these conversions:</p>
    <ul>
        <li>1 Million requests per day = <strong>~12 Requests Per Second (RPS)</strong>. Formula: <code>1,000,000 / 86,400 seconds ≈ 11.57 RPS</code>.</li>
        <li>100 Million requests per day = <strong>~1,200 RPS</strong>.</li>
        <li>1 Billion requests per day = <strong>~12,000 RPS</strong>.</li>
        <li>Storage sizes: 1 KB = 10^3 Bytes, 1 MB = 10^6 Bytes, 1 GB = 10^9 Bytes, 1 TB = 10^12 Bytes, 1 PB = 10^15 Bytes.</li>
    </ul>
    <p><strong>Formula for Daily Storage:</strong> <code>Daily Storage = Daily Writes * Average Payload Size</code>. Multiply this by 365 to calculate annual storage needs, and add a 20-30% buffer for database indexing overhead.</p>
    <!-- pagebreak -->
    <h2>Case Study Estimation 1: Social Media Timeline Sizing</h2>
    <p>Let's calculate constraints for a Twitter-like microblogging system:</p>
    <ul>
        <li><strong>DAU:</strong> 300 Million.</li>
        <li><strong>User Behavior:</strong> A user views their timeline 5 times a day, and posts 1 tweet per day.</li>
        <li><strong>Tweet Size:</strong> Average of 280 characters of text (280 Bytes) + metadata (User ID, Timestamp, Tweet ID = 100 Bytes) ≈ 400 Bytes total.</li>
        <li><strong>Media Rate:</strong> 10% of tweets contain an image (average size: 1 MB).</li>
    </ul>
    <h3>QPS Calculations:</h3>
    <pre><code>Writes QPS = 300 Million tweets/day / 86,400 seconds ≈ 3,472 writes/sec
Reads QPS = (300 Million DAU * 5 views/day) / 86,400 seconds ≈ 17,361 reads/sec</code></pre>
    <h3>Storage Sizing:</h3>
    <pre><code>Text Storage = 300 Million tweets * 400 Bytes = 120 GB/day
Media Storage = 300 Million tweets * 10% * 1 MB = 30 TB/day
Total Storage = ~30.12 TB/day</code></pre>
    <!-- pagebreak -->
    <h2>Case Study Estimation 2: Video Streaming Sizing</h2>
    <p>Let's calculate data sizes for a global video streaming platform like YouTube:</p>
    <ul>
        <li><strong>DAU:</strong> 50 Million active viewers.</li>
        <li><strong>User Behavior:</strong> Average viewer watches 30 minutes of video per day. Average upload rate is 100,000 new videos per day.</li>
        <li><strong>Video specs:</strong> Transcoded video streams average 4 Mbps (Megabits per second). Original video upload average size: 500 MB.</li>
    </ul>
    <h3>Egress Bandwidth (Network outflow):</h3>
    <p>Calculate network bandwidth required to serve viewers:</p>
    <pre><code>Concurrence = 50 Million users * (30 min / 1440 min/day) ≈ 1.04 Million concurrent viewers
Total Egress Bandwidth = 1.04 Million viewers * 4 Mbps = 4.16 Tbps (Terabits per second)</code></pre>
    <p>This massive egress rate requires distributing videos across global edge CDNs (Content Delivery Networks) to avoid network bottlenecks at core data centers.</p>
    <!-- pagebreak -->
    <h2>API Design Best Practices</h2>
    <p>APIs are the interface contracts between services. When designing a RESTful API, adhere to these principles:</p>
    <ul>
        <li><strong>Resource-Oriented:</strong> Use nouns in endpoints (e.g. <code>/posts</code>, <code>/users</code>), not verbs (e.g. <code>/getPosts</code>, <code>/createUser</code>).</li>
        <li><strong>HTTP Verbs:</strong> Use <code>GET</code> for retrieval, <code>POST</code> for creation, <code>PUT</code> for full updates, <code>PATCH</code> for partial modifications, and <code>DELETE</code> for removals.</li>
        <li><strong>Idempotency:</strong> An operation is idempotent if executing it multiple times produces the same result. <code>GET</code>, <code>PUT</code>, and <code>DELETE</code> are naturally idempotent. <code>POST</code> is not (calling POST multiple times creates duplicate resources).</li>
        <li><strong>Versioning:</strong> Version your APIs in the URI path (e.g. <code>/v1/users</code>) or request headers to allow backward-compatible schema changes.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Database Categorization Selection Matrix</h2>
    <p>Selecting the right database category depends on the type of data and query patterns:</p>
    <table>
        <thead>
            <tr>
                <th>DB Type</th>
                <th>Core Features</th>
                <th>Best For</th>
                <th>Examples</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Relational (SQL)</strong></td>
                <td>ACID transactions, strict schema, joins.</td>
                <td>Financial data, user accounts, order systems.</td>
                <td>PostgreSQL, MySQL</td>
            </tr>
            <tr>
                <td><strong>Document (NoSQL)</strong></td>
                <td>Schema-less, nested JSON structures.</td>
                <td>User profiles, catalog products, blogs.</td>
                <td>MongoDB, CouchDB</td>
            </tr>
            <tr>
                <td><strong>Key-Value (NoSQL)</strong></td>
                <td>Ultra-low latency, simple hash lookups.</td>
                <td>Cache layers, session states, shopping carts.</td>
                <td>Redis, Memcached</td>
            </tr>
            <tr>
                <td><strong>Wide-Column (NoSQL)</strong></td>
                <td>High write throughput, linear scale.</td>
                <td>IoT time-series, log analytical metrics, metadata.</td>
                <td>Cassandra, ScyllaDB</td>
            </tr>
        </tbody>
    </table>
    <!-- pagebreak -->
    <h2>High-Level Design (HLD) Drafting</h2>
    <p>An HLD is a blueprint representing the flow of a request through the system's infrastructure:</p>
    <div class="uml-text-box">
[Client] 
   | (DNS Lookup)
   v
[Route 53 DNS]
   |
   +---> [Load Balancer]
            |
            +---> [API Gateway]
                     |
                     +---> [App Servers]
                              |   | (Read/Write)
                              |   +---> [Redis Cache]
                              v
                           [PostgreSQL Master/Replica]
    </div>
    <p>In this architecture, the Load Balancer routes traffic to the API Gateway. The Gateway manages rate limiting, SSL termination, and routing to application servers. App servers read/write from Redis to speed up queries before hitting the main PostgreSQL database.</p>
    <!-- pagebreak -->
    <h2>Latency Numbers Every Developer Should Know</h2>
    <p>We must design architecture according to hardware performance. Here are key latency numbers compiled originally by Jeff Dean:</p>
    <ul>
        <li><strong>L1 cache reference:</strong> 0.5 ns</li>
        <li><strong>L2 cache reference:</strong> 7 ns (14x slower than L1)</li>
        <li><strong>Main memory reference (RAM):</strong> 100 ns (200x slower than L1)</li>
        <li><strong>Read 1 MB sequentially from SSD:</strong> 1,000,000 ns (1 ms)</li>
        <li><strong>Disk seek (HDD):</strong> 10,000,000 ns (10 ms) (10,000x slower than SSD!)</li>
        <li><strong>Send packet across WAN (e.g. US to Europe):</strong> 150 ms (150,000,000 ns)</li>
    </ul>
    <p><strong>Design Rule:</strong> RAM reads are extremely fast. Disk reads are extremely slow. Memory caching is a mandatory requirement to build high-scale, low-latency applications.</p>
            `,
        visualizer: {"type": "flowchart", "data": {"steps": [{"name": "Clarify", "desc": "Gather requirements"}, {"name": "Estimate", "desc": "Sizing calculations"}, {"name": "APIs & Schemas", "desc": "Interface design"}, {"name": "HLD Design", "desc": "Draw architecture"}, {"name": "Deep Dive", "desc": "Fix bottlenecks"}]}},
        quiz: [
            {
                question: "What is the primary difference between horizontal and vertical scaling?",
                options: [
                    "Horizontal adds more machines; vertical adds more resources (CPU/RAM) to one machine.",
                    "Vertical adds more machines; horizontal adds RAM.",
                    "Horizontal uses SQL; vertical uses NoSQL.",
                    "They are identical.",
                ],
                answer: 0,
                explanation: "Horizontal scaling adds more instances to distribute load. Vertical scaling scales up a single machine's resource specs."
            },
        ]
    },
    {
        id: "architecture-styles",
        title: "Architecture Styles",
        category: "Core Concepts",
        content: `
    <h1>Architecture Styles</h1>
    <h2>Monolithic Architectures</h2>
    <p>In a monolithic architecture, all functional parts of an application—the frontend interface, backend business logic, and database access layer—are compiled and run together as a single executable program on a single virtual server.</p>
    <ul>
        <li><strong>Advantages:</strong>
            <ul>
                <li>Easy to build, debug, and test locally.</li>
                <li>Fast execution times since all component communications happen in-memory rather than over a network.</li>
                <li>Transactional database changes are straightforward since there is only a single shared database.</li>
            </ul>
        </li>
        <li><strong>Disadvantages:</strong>
            <ul>
                <li>Scaling a single component requires scaling the entire application block.</li>
                <li>Long compilation and deploy cycles.</li>
                <li>A single bug or memory leak in one module can crash the entire system.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Microservices Architecture</h2>
    <p>Microservices split an application into smaller, loosely coupled services that run independently. Each service is responsible for a single business capability and manages its own database:</p>
    <ul>
        <li><strong>Independence:</strong> Services are built, deployed, and scaled independently by separate teams.</li>
        <li><strong>Technology Agnostic:</strong> Each microservice can be written in a different programming language (e.g., Python for AI models, Go for web servers).</li>
        <li><strong>Database per Service:</strong> Crucial to prevent tight schema coupling. Services can only exchange data via public REST, gRPC, or GraphQL APIs.</li>
    </ul>
    <p><strong>Trade-off:</strong> Microservices introduce network overhead, service discovery complexity, and make distributed transactions (Sagas) difficult to handle.</p>
    <!-- pagebreak -->
    <h2>Microservices Migration: The Strangler Fig Pattern</h2>
    <p>Migrating a monolithic system to microservices by rebuilding everything from scratch is extremely high-risk. Instead, developers use the **Strangler Fig Pattern**:</p>
    <ol>
        <li>Place an API Gateway in front of the legacy Monolith application.</li>
        <li>Build the first microservice to handle a specific domain (e.g., User Profiles).</li>
        <li>Configure the API Gateway to route traffic for that specific domain (e.g., <code>/users</code>) to the new microservice, while leaving all other traffic routed to the Monolith.</li>
        <li>Repeat this process for other modules (e.g., Billing, Payments).</li>
        <li>Over time, the Monolith shrinks until it can be turned off entirely.</li>
    </ol>
    <!-- pagebreak -->
    <h2>Service Mesh & Sidecars</h2>
    <p>As the number of microservices grows, handling service-to-service communication, load balancing, service discovery, security, and logging becomes difficult. A **Service Mesh** (e.g., Istio, Linkerd) solves this by separating business code from network code.</p>
    <ul>
        <li><strong>Sidecar Proxy:</strong> An Envoy proxy container is deployed alongside every microservice container. All network traffic goes through the sidecars.</li>
        <li><strong>Control Plane:</strong> Manages routing policies, collects metrics, and issues TLS certificates.</li>
        <li><strong>Data Plane:</strong> The network of sidecar proxies executing routing, circuit breaking, retries, and mTLS encryption.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Serverless (Function as a Service - FaaS)</h2>
    <p>Serverless computing allows developers to upload modular code functions (e.g. AWS Lambda, GCP Cloud Functions) triggered by specific events (like HTTP requests or file uploads). The cloud provider handles all server provisioning, OS maintenance, scaling, and container management.</p>
    <ul>
        <li><strong>Scale-to-Zero:</strong> If there are no requests, no containers run, and you pay nothing. Ideal for intermittent workloads.</li>
        <li><strong>Cold Starts:</strong> When a function is triggered after being idle, the platform takes time (up to a few seconds) to fetch the code, provision a container, and boot the runtime.</li>
        <li><strong>Statelessness:</strong> Functions are ephemeral; they boot up, process a request, and shut down. They cannot store state locally and must rely on external DBs like DynamoDB or Redis.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Event-Driven Architectures (EDA)</h2>
    <p>In EDA, services communicate asynchronously by publishing and consuming **Events** (records of state change). The architecture consists of:</p>
    <ul>
        <li><strong>Event Producers:</strong> Services that execute an action and publish an event message to a message broker (e.g., Order Service emits <code>order-created</code>).</li>
        <li><strong>Event Brokers:</strong> Distributed messaging buffers (e.g., Kafka, RabbitMQ) that persist and route events.</li>
        <li><strong>Event Consumers:</strong> Subscribed services that read events from the broker and execute secondary logic (e.g., Inventory Service reads <code>order-created</code> to update stocks).</li>
    </ul>
    <p><strong>Benefits:</strong> Loose coupling, fault tolerance (producers can publish even if consumers are down), and high write scalability.</p>
    <!-- pagebreak -->
    <h2>Event Sourcing Pattern</h2>
    <p>Traditional databases only store the **current state** of a record. Event Sourcing stores the state of a business entity as a sequence of **append-only events** in an Event Store database:</p>
    <div class="uml-text-box">
Traditional DB: Account { balance: $150 }

Event Sourcing Log:
1. AccountCreated  (balance: $0)
2. DepositExecuted (+$200)
3. WithdrawClicked (-$50)
    </div>
    <p><strong>Benefits:</strong> Absolute audit trail, time-travel capabilities (you can rebuild state at any point in history by replaying events), and elimination of database write locks since events are strictly appended.</p>
    <!-- pagebreak -->
    <h2>CQRS (Command Query Responsibility Segregation)</h2>
    <p>CQRS splits database operations into two paths: Commands (Write, Update, Delete actions) and Queries (Read actions):</p>
    <ul>
        <li><strong>Write Path (Commands):</strong> Handles input validation and writes to a write-optimized database. Emits state changes as events.</li>
        <li><strong>Read Path (Queries):</strong> Reads from a read-optimized, denormalized database (e.g., Elasticsearch, Read Replica DB) optimized for rapid search queries.</li>
        <li><strong>Synchronization:</strong> A background process listens to write events and updates the read database asynchronously, leading to eventual consistency.</li>
    </ul>
            `,
        visualizer: {"type": "monolith-vs-micro", "title": "Monolith vs Microservices Visualizer", "desc": "Toggle database layouts."},
        quiz: [
            {
                question: "Which pattern describes migrating monolithic applications to microservices step-by-step?",
                options: [
                    "Saga Pattern",
                    "Strangler Fig Pattern",
                    "Circuit Breaker Pattern",
                    "Outbox Pattern",
                ],
                answer: 1,
                explanation: "The Strangler Fig pattern places an API gateway in front of the monolith and routes endpoints to microservices gradually."
            },
        ]
    },
    {
        id: "uml-diagrams",
        title: "UML Diagrams",
        category: "Core Concepts",
        content: `
    <h1>UML Diagrams</h1>
    <h2>UML Modeling Foundations</h2>
    <p>Unified Modeling Language (UML) is a standardized visual language used to specify, document, and model software system architectures. UML is split into two categories:</p>
    <ul>
        <li><strong>Structural Diagrams:</strong> Model the static entities, objects, interfaces, and databases. (e.g., Class Diagrams, Component Diagrams, Deployment Diagrams).</li>
        <li><strong>Behavioral Diagrams:</strong> Model the dynamic workflows, interactions, and state changes over time. (e.g., Sequence Diagrams, Activity Diagrams, State Machine Diagrams).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Class Diagrams: Static Structures</h2>
    <p>A Class Diagram depicts classes, attributes, methods, and relationships in an object-oriented codebase. It represents the blueprint of your system's data model:</p>
    <div class="uml-text-box">
+---------------------------------------+
|                Account                |
+---------------------------------------+
| - accountNumber: String               |
| - balance: Double                     |
+---------------------------------------+
| + deposit(amount: Double): Boolean    |
| + withdraw(amount: Double): Boolean   |
+---------------------------------------+
    </div>
    <p>Visibility markers indicate accessibility: <code>-</code> for private, <code>+</code> for public, and <code>#</code> for protected fields/methods.</p>
    <!-- pagebreak -->
    <h2>Class Relationships</h2>
    <p>Class connections define how objects interact. Key UML relationship symbols:</p>
    <ul>
        <li><strong>Association:</strong> Basic link between two classes. Represented as a simple line. (e.g., Driver drives Car).</li>
        <li><strong>Aggregation:</strong> "Has-a" relationship where the child can exist independently of the parent. Symbol: Empty Diamond on the parent side. (e.g., Team has Players. If the Team is deleted, Players still exist).</li>
        <li><strong>Composition:</strong> "Part-of" relationship where the child cannot exist without the parent. Symbol: Solid Diamond on the parent side. (e.g., House has Rooms. If House is deleted, Rooms are destroyed).</li>
        <li><strong>Generalization (Inheritance):</strong> Symbol: Empty Triangle pointing to the parent class.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Sequence Diagrams: Temporal Interactions</h2>
    <p>Sequence diagrams display chronological message exchanges between objects or lifelines:</p>
    <ul>
        <li><strong>Lifeline:</strong> Vertical dashed lines representing an instance of a class or server.</li>
        <li><strong>Activation Bar:</strong> Vertical rectangle on the lifeline indicating when the process is executing.</li>
        <li><strong>Synchronous Message:</strong> Solid line with a filled arrowhead. The caller blocks until a response returns.</li>
        <li><strong>Asynchronous Message:</strong> Solid line with an open arrowhead. The caller continues executing without waiting for a response.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Activity Diagrams: Workflow Logic</h2>
    <p>Activity diagrams represent the step-by-step control flows of business logic. They are dynamic flowcharts that support concurrency:</p>
    <ul>
        <li><strong>Initial Node:</strong> Solid black circle marking the start of the workflow.</li>
        <li><strong>Decision Node:</strong> Diamond shape with conditional guards (e.g., <code>[Balance > Total]</code>) routing traffic to different paths.</li>
        <li><strong>Fork:</strong> Solid black horizontal or vertical bar that splits a single control flow into two or more parallel execution paths.</li>
        <li><strong>Join:</strong> Solid black bar that merges parallel flows back into a single thread.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Component Diagrams: Modular Architectures</h2>
    <p>Component diagrams depict how software modules, packages, and subsystems are wired together to construct large software platforms. They define structural interfaces:</p>
    <ul>
        <li><strong>Component:</strong> Modular, encapsulated block of code with provided and required interfaces. Symbol: Box with two small rectangles on the left.</li>
        <li><strong>Provided Interface (Lollipop):</strong> Interface contract the component implements and exposes to external clients.</li>
        <li><strong>Required Interface (Socket):</strong> Interface connection the component requires to run its operations.</li>
    </ul>
    <!-- pagebreak -->
    <h2>State Machine Diagrams</h2>
    <p>State Machine diagrams model the lifecycle of a single object or document as it transitions through states in response to external events:</p>
    <ul>
        <li><strong>State:</strong> A condition or situation during the life of an object (e.g., <code>Draft</code>, <code>Pending Payment</code>, <code>Shipped</code>).</li>
        <li><strong>Transition:</strong> A path from one state to another triggered by an event.</li>
        <li><strong>Guard:</strong> A boolean condition enclosed in brackets (e.g. <code>[stock > 0]</code>) that must evaluate to true for the transition to execute.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Use Case Diagrams</h2>
    <p>Use Case diagrams specify the actors, system boundaries, and actions. They describe the system's external scope:</p>
    <ul>
        <li><strong>Actor:</strong> A stick figure representing a role played by an user or external system (e.g., Customer, Payment Gateway).</li>
        <li><strong>Use Case:</strong> An oval representing a functional action.</li>
        <li><strong>Include (&lt;&lt;include&gt;&gt;):</strong> Represents mandatory sub-actions (e.g. "Checkout" includes "Process Payment").</li>
        <li><strong>Extend (&lt;&lt;extend&gt;&gt;):</strong> Represents optional actions (e.g. "Checkout" extends "Apply Coupon").</li>
    </ul>
            `,
        visualizer: {"type": "sequence-anim", "title": "Sequence Diagram Flow", "desc": "Hover lifelines."},
        quiz: [
            {
                question: "In UML Class Diagrams, what does a solid diamond symbol indicate on a relationship line?",
                options: [
                    "Aggregation",
                    "Composition",
                    "Generalization",
                    "Association",
                ],
                answer: 1,
                explanation: "A solid diamond represents Composition, meaning child objects cannot exist without the parent object."
            },
        ]
    },
    {
        id: "system-diagrams",
        title: "Architecture & System Diagrams",
        category: "Core Concepts",
        content: `
    <h1>Architecture & System Diagrams</h1>
    <h2>System Diagram Foundations</h2>
    <p>System diagrams are visual maps of software architecture. They align development teams, document deployments, and identify performance bottlenecks. Without standardized conventions, diagrams often end up as confusing "box-and-line" drawings.</p>
    <p><strong>Best Practice:</strong> Standardize notation. Always include a legend explaining what solid vs. dashed lines mean, color definitions, and port communication protocols (e.g. <code>HTTPS/JSON on 443</code>).</p>
    <!-- pagebreak -->
    <h2>C4 Model Level 1: System Context Diagrams</h2>
    <p>The C4 Context diagram is a high-level view showing the software system you are designing in relation to its actors and surrounding systems:</p>
    <ul>
        <li><strong>Scope:</strong> The system boundary is highlighted.</li>
        <li><strong>Actors:</strong> Maps users (e.g. Customers, Site Admins) surrounding the system.</li>
        <li><strong>External Systems:</strong> Maps external systems, third-party APIs (e.g. Stripe, Twilio SMS) your platform calls.</li>
        <li><strong>Target Audience:</strong> Product Managers, business stakeholders, and new engineers. Keep technical details abstract.</li>
    </ul>
    <!-- pagebreak -->
    <h2>C4 Model Level 2: Container Diagrams</h2>
    <p>Zooming inside your system boundary leads to the Container Diagram. A **Container** represents a single deployable application or database. It shows the high-level architecture:</p>
    <ul>
        <li><strong>Containers:</strong> SPA (Single Page React App), Mobile iOS App, REST API Service, Redis Cache, MongoDB Document Store.</li>
        <li><strong>Interactions:</strong> Shows how containers communicate (e.g. <code>HTTPS request</code>, <code>gRPC stream</code>, <code>TCP database driver</code>).</li>
        <li><strong>Target Audience:</strong> Architects, Backend developers, and SREs.</li>
    </ul>
    <!-- pagebreak -->
    <h2>C4 Model Level 3: Component Diagrams</h2>
    <p>The Component diagram zooms into a single Container (like the REST API Service) to show its internal structure:</p>
    <ul>
        <li><strong>Components:</strong> Encapsulated logical modules (e.g. AuthenticationController, OrderManager, EmailNotifier, SchemaValidator).</li>
        <li><strong>Dependencies:</strong> Shows how modules depend on each other and write to storage interfaces.</li>
        <li><strong>Target Audience:</strong> Developers actively writing code in the codebase.</li>
    </ul>
    <!-- pagebreak -->
    <h2>C4 Model Level 4: Code Diagrams</h2>
    <p>The Code diagram zooms inside a single Component (like the OrderManager) to map implementation details:</p>
    <ul>
        <li><strong>Contents:</strong> UML Class diagrams, Entity-Relationship diagrams (ERD).</li>
        <li><strong>Utility:</strong> Highly detailed, mapping specific object properties, inheritance models, database foreign keys, and interfaces. Often auto-generated directly from code.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Deployment Diagrams</h2>
    <p>While C4 maps logical software elements, **Deployment Diagrams** map physical hardware architecture:</p>
    <ul>
        <li><strong>Physical Nodes:</strong> Servers, hardware VMs, cloud instances (AWS EC2), container pods (Kubernetes).</li>
        <li><strong>Location:</strong> Maps geographic regions (e.g., <code>us-east-1</code>) and Availability Zones (data centers).</li>
        <li><strong>Deployment Topology:</strong> Shows load balancer target groups, autoscaling boundaries, database master/replica locations, and connection ports.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Network Topology: Subnets & VPCs</h2>
    <p>A secure deployment diagram must map the network infrastructure:</p>
    <ul>
        <li><strong>VPC (Virtual Private Cloud):</strong> An isolated logical network partition on the cloud.</li>
        <li><strong>Public Subnet:</strong> Subnet with direct routing to an Internet Gateway. Contains load balancers and NAT gateways.</li>
        <li><strong>Private Subnet:</strong> Subnet with no direct internet access. Application instances and databases are kept here for security.</li>
        <li><strong>Security Group:</strong> Firewall rules controlling ingress and egress IP ranges and ports (e.g. only allowing port 5432 ingress from the app servers subnet to the database node).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Data Flow Diagrams (DFDs)</h2>
    <p>DFDs map the path and transformations of data as it moves through a system. Unlike standard flowcharts, DFDs focus on **data inputs, processing pipelines, data stores, and outputs** rather than execution controls. They are key to designing ETL (Extract, Transform, Load) pipelines and analytics engines.</p>
            `,
        visualizer: {"type": "c4-zoom", "title": "C4 Diagrams", "desc": "Context vs Container."},
        quiz: [
            {
                question: "Which C4 model level focuses on mapping physical container runtimes like databases or browsers?",
                options: [
                    "Level 1: System Context",
                    "Level 2: Container",
                    "Level 3: Component",
                    "Level 4: Code",
                ],
                answer: 1,
                explanation: "Level 2 (Container diagram) maps individual executable applications, frontend SPAs, and databases."
            },
        ]
    },
    {
        id: "cap-pacelc",
        title: "CAP Theorem & PACELC",
        category: "Core Concepts",
        content: `
    <h1>CAP Theorem & PACELC</h1>
    <h2>Introduction to CAP</h2>
    <p>The CAP Theorem states that a distributed data store can simultaneously guarantee at most two of the following three properties:</p>
    <ul>
        <li><strong>Consistency (C):</strong> Equivalent to linearizability. Every read returns the most recent write or an error.</li>
        <li><strong>Availability (A):</strong> Every non-failing node returns a successful response for every request (without guarantee that it contains the most recent write).</li>
        <li><strong>Partition Tolerance (P):</strong> The system continues to operate despite network partitions (dropped/delayed messages between nodes).</li>
    </ul>
    <!-- pagebreak -->
    <h2>The Gilbert and Lynch Formal Proof</h2>
    <p>Seth Gilbert and Nancy Lynch formally proved CAP in 2002. Imagine a simple two-node cluster: Node G1 and Node G2:</p>
    <div class="uml-text-box">
Node G1  <--- Network Partition (Blocked Link) --->  Node G2
    </div>
    <ol>
        <li>A client writes to Node G1: <code>Value = 'A'</code>.</li>
        <li>Because of a network partition, Node G1 cannot forward this write to Node G2.</li>
        <li>A second client reads from Node G2.</li>
        <li>Node G2 has two options:
            <ul>
                <li><strong>Option A:</strong> Return its stale value (violates Consistency, maintains Availability).</li>
                <li><strong>Option B:</strong> Block the read or return an error (violates Availability, maintains Consistency).</li>
            </ul>
        </li>
    </ol>
    <!-- pagebreak -->
    <h2>Why Partition Tolerance (P) is Mandatory</h2>
    <p>Network partitions are an unavoidable physical reality. Hardware failures, switch restarts, optical fiber degradation, and congestion will eventually cause nodes to lose communication.</p>
    <p>Therefore, a system cannot choose <strong>CA</strong> (Consistency + Availability without Partition Tolerance). You must choose: </p>
    <ul>
        <li><strong>CP:</strong> Prioritize Consistency. During a partition, block updates to prevent data drift.</li>
        <li><strong>AP:</strong> Prioritize Availability. Allow updates during partitions, accepting that data will temporarily diverge.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Designing CP Systems</h2>
    <p>CP systems are chosen when data accuracy is critical (e.g. bank balances, locking systems). Design characteristics:</p>
    <ul>
        <li><strong>Consensus Algorithms:</strong> Nodes run Raft or Paxos. Writes require a quorum (majority, e.g. 3 out of 5 nodes) to complete.</li>
        <li><strong>Partition Behavior:</strong> If a network partition splits a 5-node cluster into a 2-node partition and a 3-node partition:
            <ul>
                <li>The 2-node partition cannot form a majority and rejects writes.</li>
                <li>The 3-node partition forms a majority and accepts writes, maintaining consistency.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Designing AP Systems</h2>
    <p>AP systems are chosen when user responsiveness is critical (e.g. social media feeds, shopping carts). Design characteristics:</p>
    <ul>
        <li><strong>Gossip Protocols:</strong> Nodes share updates in the background.</li>
        <li><strong>Conflict Resolution:</strong> When partitions heal, systems resolve divergent states using **Last-Write-Wins (LWW)** or **Conflict-Free Replicated Data Types (CRDTs)**.</li>
        <li><strong>Vector Clocks:</strong> Logical clocks used to track event causality and resolve conflicts.</li>
    </ul>
    <!-- pagebreak -->
    <h2>The PACELC Theorem</h2>
    <p>Daniel Abadi realized that CAP only describes system behavior during rare network partitions. PACELC extends CAP to model trade-offs during **normal operations** (when there are no partitions):</p>
    <p><strong>PACELC formula:</strong> If there is a <strong>P</strong>artition, how does the system choose between <strong>A</strong>vailability and <strong>C</strong>onsistency? <strong>E</strong>lse, how does the system choose between <strong>L</strong>atency and <strong>C</strong>onsistency?</p>
    <!-- pagebreak -->
    <h2>PACELC System Classifications</h2>
    <p>Distributed systems fall into distinct PACELC categories:</p>
    <ul>
        <li><strong>PA/EL (Cassandra, DynamoDB):</strong> During partition, choose Availability. During normal operations, choose low Latency (uses asynchronous replication, returning success before all replicas write).</li>
        <li><strong>PC/EC (Spanner, MongoDB):</strong> During partition, choose Consistency. During normal operations, choose Consistency (waits for synchronous replica writes, increasing latency).</li>
        <li><strong>AP/EL (Couchbase):</strong> AP during partitions, but EL during normal operations.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Real-world CAP Partition Scenarios</h2>
    <p>Consider a multi-region retail site. A network partition disconnects the US data center from the EU data center. A customer in the EU tries to buy the last book in stock. An AP system processes the purchase, risking an oversell if a US user buys it at the same time. A CP system blocks the checkout page in the EU until the connection to the US database is restored, preventing inventory inconsistencies.</p>
            `,
        visualizer: {"type": "cap-interactive", "title": "CAP Theorem Venn Diagram", "desc": "Understand distributed trade-offs."},
        quiz: [
            {
                question: "According to the PACELC theorem, what does a 'PC/EC' database prioritize?",
                options: [
                    "Consistency over availability under partition; consistency over latency during normal operations.",
                    "Availability and Latency.",
                    "Locks and transactions.",
                    "Disk operations.",
                ],
                answer: 0,
                explanation: "PC/EC indicates that the system prioritizes Consistency (C) both under Partition (P) and Else (E) normal operations."
            },
        ]
    },
    {
        id: "load-balancing",
        title: "Load Balancing",
        category: "Core Concepts",
        content: `
    <h1>Load Balancing</h1>
    <h2>Introduction to Load Balancing</h2>
    <p>A single server cannot scale infinitely. A Load Balancer (LB) is a physical or virtual appliance that acts as a traffic cop, routing incoming client requests across a pool of backend servers. This prevents any single server from becoming overloaded and eliminates single points of failure (SPOF).</p>
    <!-- pagebreak -->
    <h2>Layer 4 Load Balancing: Transport Layer Routing</h2>
    <p>Layer 4 (L4) load balancers operate at the transport layer of the OSI model, routing traffic based on TCP and UDP protocols:</p>
    <ul>
        <li><strong>Routing Strategy:</strong> Inspects IP addresses and TCP port numbers. It does not look at the application content (like HTTP headers or URLs).</li>
        <li><strong>Performance:</strong> Fast with minimal CPU overhead because it does not decrypt or parse payloads.</li>
        <li><strong>Limitations:</strong> Cannot route requests based on application logic (e.g. separating API paths).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Layer 7 Load Balancing: Application Layer Routing</h2>
    <p>Layer 7 (L7) load balancers operate at the application layer, routing traffic based on application data:</p>
    <ul>
        <li><strong>Routing Strategy:</strong> Inspects HTTP headers, cookies, query parameters, and URL paths (e.g., routing <code>/api</code> to application servers and <code>/static</code> to storage servers).</li>
        <li><strong>Features:</strong> Performs SSL/TLS decryption (SSL termination), allowing it to inspect payloads. It can also manage cookies for session persistence.</li>
        <li><strong>Performance:</strong> Requires more CPU and memory resources than L4 LBs to parse application-layer protocols.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Standard Routing Algorithms</h2>
    <p>Load balancers use algorithms to distribute traffic across healthy servers:</p>
    <ul>
        <li><strong>Round Robin:</strong> Routes requests to servers sequentially in a cycle. Best when servers have identical hardware specs.</li>
        <li><strong>Weighted Round Robin:</strong> Assigns a weight to each server based on its capacity (e.g., Server A with weight 3 gets 3x more requests than Server B with weight 1).</li>
        <li><strong>Least Connections:</strong> Routes requests to the server with the fewest active sessions. Ideal for long-running connections like databases.</li>
        <li><strong>Least Response Time:</strong> Routes requests to the fastest-responding server.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Sticky Sessions (Session Persistence)</h2>
    <p>Many legacy web applications store session data (like shopping carts) in the server's local memory (RAM) instead of a shared session database. This requires **Sticky Sessions**:</p>
    <ul>
        <li><strong>Implementation:</strong> The L7 load balancer reads a session cookie or client IP address and routes all requests from that client to the same backend server.</li>
        <li><strong>Drawback:</strong> Limits scaling flexibility. If a server crashes, all users pinned to it lose their session data. Best practice is to use **stateless application servers** and store session data in a shared Redis cluster.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Hash-Based Routing</h2>
    <p>Hash-based routing uses client-specific attributes to calculate a server destination:</p>
    <ul>
        <li><strong>Formula:</strong> <code>server_index = hash(client_ip) % N</code>, where <code>N</code> is the number of backend servers.</li>
        <li><strong>Advantage:</strong> Deterministic. A client always routes to the same server, which can improve local cache hit rates.</li>
        <li><strong>Major Flaw:</strong> If a server is added or removed, <code>N</code> changes. Almost all client IPs will hash to different servers, causing cache misses and breaking session states.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Consistent Hashing Ring</h2>
    <p>Consistent Hashing solves the limitation of traditional modulo hashing. It maps both servers and client keys onto a circular hash ring (e.g., using a 32-bit integer range):</p>
    <div class="uml-text-box">
             [Server A (at 90 deg)]
           /                        \
[Key 1] (at 120 deg)               [Server B (at 210 deg)]
           \                        /
             [Server C (at 300 deg)]
    </div>
    <p><strong>Routing Strategy:</strong> A key is hashed to a position on the ring. The request routes to the next server encountered when traversing the ring clockwise. If Server B is removed, only the keys that mapped to B move to Server C. The rest of the keys remain mapped to their respective servers.</p>
    <!-- pagebreak -->
    <h2>Virtual Nodes (Vnodes)</h2>
    <p>If there are only a few physical servers, consistent hashing can lead to an uneven distribution of keys across the ring, overloading one server. Consistent hashing solves this using **Virtual Nodes (Vnodes)**:</p>
    <ul>
        <li><strong>Concept:</strong> Each physical server is mapped to multiple positions on the ring (e.g., Server A is mapped as <code>A-1</code>, <code>A-2</code>, <code>A-3</code>).</li>
        <li><strong>Result:</strong> Skewed key distributions are averaged out across all nodes, preventing hotspots.</li>
    </ul>
            `,
        visualizer: {"type": "load-balancer", "title": "Load Balancer Simulator", "desc": "Distribute traffic."},
        quiz: [
            {
                question: "What is the purpose of virtual nodes (vnodes) in consistent hashing rings?",
                options: [
                    "To encrypt traffic",
                    "To distribute keys evenly across physical servers, preventing hotspots",
                    "To run virtual machines",
                    "To speed up TCP connections",
                ],
                answer: 1,
                explanation: "Vnodes map each physical server to multiple hash values on the ring, smoothing out key distribution."
            },
        ]
    },
    {
        id: "caching",
        title: "Caching — Redis & CDN",
        category: "Core Concepts",
        content: `
    <h1>Caching — Redis & CDN</h1>
    <h2>Memory Hierarchy & Locality</h2>
    <p>Caching stores copies of frequently accessed data in fast, volatile memory (RAM) to avoid slow read paths (SSDs, HDDs, or network databases). This is based on two principles:</p>
    <ul>
        <li><strong>Temporal Locality:</strong> Recently accessed data is likely to be accessed again soon.</li>
        <li><strong>Spatial Locality:</strong> Data physically stored near recently accessed data is likely to be accessed soon.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Cache-Aside (Lazy Loading) Pattern</h2>
    <p>The Cache-Aside pattern is the most common caching strategy:</p>
    <div class="uml-text-box">
App ---> Read Cache ---> (Hit) ---> Return
            |
          (Miss)
            v
       Read DB ---> Write to Cache ---> Return
    </div>
    <ul>
        <li><strong>Read Path:</strong> The application queries the cache. On a cache hit, it returns the data. On a cache miss, it reads from the database, updates the cache, and returns the data.</li>
        <li><strong>Write Path:</strong> Writes are committed directly to the database. The cached key is then evicted (deleted) to prevent stale reads.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Write-Through vs. Write-Back (Write-Behind) Patterns</h2>
    <p>These strategies integrate the cache as the main entry point for writes:</p>
    <ul>
        <li><strong>Write-Through:</strong> The application writes to the cache. The cache synchronously writes to the database before returning success.
            <ul>
                <li><em>Benefit:</em> No stale cache data.</li>
                <li><em>Drawback:</em> Slower write latency due to two synchronous writes.</li>
            </ul>
        </li>
        <li><strong>Write-Back (Write-Behind):</strong> The application writes to the cache, which responds immediately. The cache then asynchronously writes updates to the database in background batches.
            <ul>
                <li><em>Benefit:</em> Extremely fast write speeds. Ideal for write-heavy systems.</li>
                <li><em>Drawback:</em> Risk of data loss if the cache server crashes before updates are written to the database.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Cache Eviction Policies</h2>
    <p>Since cache memory is limited, systems use eviction policies to remove keys when the cache is full:</p>
    <ul>
        <li><strong>LRU (Least Recently Used):</strong> Discards the least recently accessed items first. Uses a hash map linked to a doubly-linked list.</li>
        <li><strong>LFU (Least Frequently Used):</strong> Discards the items accessed the least number of times.</li>
        <li><strong>FIFO (First In First Out):</strong> Discards the oldest items regardless of access frequency.</li>
        <li><strong>ARC (Adaptive Replacement Cache):</strong> Dynamically adjusts between LRU and LFU based on recent hit patterns to optimize hit ratios.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Cache Coherency & Stale Data</h2>
    <p>Cache Coherency ensures cached copies stay in sync with the database. Stale data happens when the database is updated but the cache is not. Mitigation strategies:</p>
    <ul>
        <li><strong>TTL (Time-To-Live):</strong> Setting an expiration window on cache keys (e.g. 5 minutes). When the TTL expires, the key is evicted, and the next read triggers a database refresh.</li>
        <li><strong>Active Invalidation:</strong> Implementing database triggers or CDC (Change Data Capture) pipelines to evict or update cache keys immediately when a row changes.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Cache Stampede & Cache Penetration</h2>
    <ul>
        <li><strong>Cache Penetration:</strong> Requests for keys that do not exist (e.g., User ID 999999) bypass the cache and hit the database every time.
            <ul>
                <li><em>Mitigation:</em> Use a <strong>Bloom Filter</strong> in front of the cache to quickly verify if a key exists without querying the database, or cache the key with a null value and a short TTL.</li>
            </ul>
        </li>
        <li><strong>Cache Stampede (Dogpiling):</strong> Occurs when a high-traffic key expires. Multiple concurrent requests miss the cache and hit the database at the same time, degrading database performance.
            <ul>
                <li><em>Mitigation:</em> Use mutex locks so only the first thread queries the database to rebuild the cache, while other threads wait or return stale data.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Cache Avalanche Mitigation</h2>
    <p><strong>Cache Avalanche:</strong> A mass expiration of keys at once overloads the database. This often happens when bulk cache keys are initialized at the same time (e.g. during a deploy or system boot) with the same TTL (e.g., exactly 1 hour).</p>
    <p><strong>Mitigation:</strong> Add a **random jitter** to the TTL (e.g., <code>TTL = 3600 seconds + random(-300, 300)</code>). This spreads out expiration windows, smoothing load on the database.</p>
    <!-- pagebreak -->
    <h2>CDNs (Content Delivery Networks)</h2>
    <p>A CDN is a geographically distributed network of proxy servers that cache static assets (HTML, CSS, JS, images, videos) close to end-users:</p>
    <ul>
        <li><strong>Edge Servers (PoPs):</strong> Point of Presence servers located inside local ISP networks.</li>
        <li><strong>Anycast Routing:</strong> Routes client requests to the physically closest CDN edge server.</li>
        <li><strong>Origin Shielding:</strong> Caches assets at regional hubs to shield the origin application server from load spikes.</li>
    </ul>
            `,
        visualizer: {"type": "cache-lookup", "title": "Cache Aside Read Flow", "desc": "Request User IDs."},
        quiz: [
            {
                question: "Which cache issue is mitigated by adding a random jitter to the TTL values?",
                options: [
                    "Cache Penetration",
                    "Cache Stampede",
                    "Cache Avalanche",
                    "Stale Data",
                ],
                answer: 2,
                explanation: "Cache Avalanche occurs when multiple keys expire at the same time. Adding jitter spreads out expiration times."
            },
        ]
    },
    {
        id: "message-queues",
        title: "Message Queues — Kafka & RabbitMQ",
        category: "Data & Communication",
        content: `
    <h1>Message Queues — Kafka & RabbitMQ</h1>
    <h2>Asynchronous Messaging Foundations</h2>
    <p>In synchronous communication (HTTP/REST), the client blocks and waits for the server to respond. If the server is slow or offline, the client call fails. Message queues enable **asynchronous communication**:</p>
    <ul>
        <li><strong>Decoupling:</strong> The producer service publishes a message to the broker and continues executing. It does not need to know which services consume it.</li>
        <li><strong>Load Leveling (Buffering):</strong> During traffic spikes, the message queue stores incoming requests safely on disk. Consumers process messages at their own pace, preventing the database from becoming overloaded.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Message Queue Patterns</h2>
    <p>Message queues support two primary communication models:</p>
    <ul>
        <li><strong>Point-to-Point (Message Queue):</strong> Messages are placed in a queue. Exactly one consumer receives and processes each message. Once processed, the message is deleted. Used for job processing.</li>
        <li><strong>Publish-Subscribe (Pub/Sub):</strong> Messages are published to a Topic. The broker broadcasts copies of the message to all consumer groups subscribed to that topic. Used for event-driven coordination.</li>
    </ul>
    <!-- pagebreak -->
    <h2>RabbitMQ: AMQP Broker</h2>
    <p>RabbitMQ is an open-source message broker based on the Advanced Message Queuing Protocol (AMQP) standard:</p>
    <ul>
        <li><strong>Smart Broker, Dumb Consumer:</strong> The broker manages message states, routes, and deletions. It keeps track of which messages have been delivered and acknowledged.</li>
        <li><strong>Message Delivery:</strong> Once a consumer acknowledges a message, the broker deletes it immediately.</li>
        <li><strong>Reliability:</strong> Supports transactional safety and dead letter queues (DLQs) to store poison-pill messages that fail processing.</li>
    </ul>
    <!-- pagebreak -->
    <h2>RabbitMQ Routing: Exchanges</h2>
    <p>In RabbitMQ, producers do not publish directly to queues. They send messages to an **Exchange**, which routes them to queues based on routing keys:</p>
    <ul>
        <li><strong>Direct Exchange:</strong> Routes messages to queues based on an exact routing key match.</li>
        <li><strong>Fanout Exchange:</strong> Ignores routing keys and broadcasts messages to all bound queues.</li>
        <li><strong>Topic Exchange:</strong> Routes messages to queues based on wildcard routing key matches (e.g. <code>*.orders.checkout</code> matches <code>us.orders.checkout</code>).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Apache Kafka: Commit Log Architecture</h2>
    <p>Apache Kafka is a distributed event-streaming platform designed for high throughput. It uses a different design than traditional message queues:</p>
    <ul>
        <li><strong>Append-Only Log:</strong> A Kafka topic is an append-only commit log stored on disk. Messages are immutable and appended sequentially.</li>
        <li><strong>Dumb Broker, Smart Consumer:</strong> Kafka does not track message acknowledgments. It keeps messages on disk for a configured retention period (e.g., 7 days). Consumers track their own reading progress using an index pointer called an **Offset**.</li>
        <li><strong>Replayability:</strong> Since messages are persisted, consumers can replay events from any point in time by resetting their offset.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Kafka Consumer Groups & Partitions</h2>
    <p>To scale read throughput, Kafka topics are divided into multiple **Partitions** distributed across cluster nodes:</p>
    <ul>
        <li><strong>Parallel Processing:</strong> Within a **Consumer Group**, each consumer instance is assigned to read from distinct partitions.</li>
        <li><strong>Partition Limits:</strong> A single partition can only be read by one consumer instance in a group. To increase consumer parallelism, you must increase partition counts.</li>
        <li><strong>Ordering Guarantee:</strong> Kafka guarantees strict message ordering *only* within a single partition, not across the entire topic.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Zero-Copy Reads</h2>
    <p>Kafka can stream millions of messages per second because it avoids CPU-heavy operations during file transfers using **Zero-Copy Reads**:</p>
    <ul>
        <li><strong>Traditional path:</strong> Read file from disk -> load to OS Page Cache -> copy to application memory buffer -> copy to socket buffer -> network output. (4 data copies, 4 context switches).</li>
        <li><strong>Zero-Copy path:</strong> The application uses the OS <code>sendfile()</code> system call. The kernel transfers data directly from the page cache to the network interface card (NIC) buffer, bypassing application memory space. (2 data copies, 2 context switches).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Message Delivery Semantics</h2>
    <p>Distributed message queues support three delivery guarantees:</p>
    <ul>
        <li><strong>At-most-once:</strong> Messages may be lost but are never delivered twice. (Consumer commits offset *before* processing message).</li>
        <li><strong>At-least-once:</strong> Messages are never lost but may be duplicated. (Consumer commits offset *after* processing message. Requires consumers to be **idempotent**).</li>
        <li><strong>Exactly-once:</strong> Messages are processed exactly once. Requires coordination between the broker and consumer database transactions (e.g. Kafka transactions).</li>
    </ul>
            `,
        visualizer: {"type": "message-queue", "title": "Asynchronous Event Simulator", "desc": "Decouple services."},
        quiz: [
            {
                question: "Which message broker uses an append-only commit log and lets consumers manage their own reading offsets?",
                options: [
                    "RabbitMQ",
                    "Apache Kafka",
                    "ActiveMQ",
                    "SQS",
                ],
                answer: 1,
                explanation: "Apache Kafka is built on a commit log architecture where consumers keep track of their own partition offsets."
            },
        ]
    },
    {
        id: "api-design",
        title: "API Design — REST, GraphQL & gRPC",
        category: "Data & Communication",
        content: `
    <h1>API Design — REST, GraphQL & gRPC</h1>
    <h2>API Contracts & Evolution</h2>
    <p>API design defines the interfaces between systems. A great API is self-documenting, backward-compatible, and resource-efficient. When APIs change, developers must prevent breaking client applications by using versioning models (e.g. <code>/api/v1/resource</code> or utilizing custom HTTP accept headers).</p>
    <!-- pagebreak -->
    <h2>REST Architecture Constraints</h2>
    <p>REST (Representational State Transfer) is a resource-based architectural style introduced by Roy Fielding. It relies on standard HTTP methods:</p>
    <ul>
        <li><strong>Stateless:</strong> Every client request must contain all context and authentication tokens required to process it. The server does not store client session states.</li>
        <li><strong>Uniform Interface:</strong> Standardizes resource identifiers (URIs) and self-descriptive representations (JSON/XML).</li>
        <li><strong>Client-Server Separation:</strong> Decouples the frontend interface from the backend logic, allowing them to evolve independently.</li>
    </ul>
    <!-- pagebreak -->
    <h2>REST API Pagination Strategies</h2>
    <p>When returning large lists, APIs must paginate responses to prevent database and network overload. The two primary strategies are:</p>
    <ul>
        <li><strong>Offset Pagination:</strong> Uses SQL <code>LIMIT</code> and <code>OFFSET</code> (e.g., <code>GET /api/v1/posts?page=3&size=20</code>).
            <ul>
                <li><em>Drawback:</em> High database overhead at large offsets, as the database must read and discard all previous rows. It is also prone to duplicate items if rows are inserted while a user is paginating.</li>
            </ul>
        </li>
        <li><strong>Cursor Pagination:</strong> Uses a unique, sequential column value (like a timestamp or record ID) as a pointer (e.g., <code>GET /api/v1/posts?limit=20&starting_after=PostUUID-921</code>).
            <ul>
                <li><em>Benefit:</em> Constant database query times even at deep offsets, and prevents duplicates. Highly recommended for infinite scrolling feeds.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>GraphQL: Client-Defined Payloads</h2>
    <p>GraphQL is an open-source query language for APIs developed by Facebook. Instead of exposing multiple resource endpoints (e.g. <code>/users</code>, <code>/posts</code>), GraphQL exposes a single endpoint (<code>POST /graphql</code>) and parses query strings:</p>
    <ul>
        <li><strong>Eliminates Over-fetching:</strong> The client specifies the exact fields it needs, reducing payload size.</li>
        <li><strong>Eliminates Under-fetching:</strong> Clients can fetch nested relational resources (e.g., posts and their comments) in a single request.</li>
        <li><strong>Strongly Typed:</strong> Uses schema definitions (Schema Definition Language - SDL) to validate queries.</li>
    </ul>
    <!-- pagebreak -->
    <h2>GraphQL Resolver Performance: The N+1 Query Problem</h2>
    <p>GraphQL resolvers process fields independently. If a query requests 10 posts and their authors, a naive resolver will make 1 initial query to fetch the posts, followed by 10 separate queries to fetch the author for each post (10+1 = 11 database queries total).</p>
    <p><strong>Mitigation:</strong> Use **DataLoaders**. DataLoaders batch individual queries during a request cycle into a single query (e.g., using SQL <code>SELECT * FROM authors WHERE id IN (1,2,3...10)</code>) and cache the results to prevent duplicate database calls.</p>
    <!-- pagebreak -->
    <h2>gRPC: High-Performance RPC</h2>
    <p>gRPC is an open-source Remote Procedure Call framework developed by Google. It is optimized for microservice-to-microservice communication:</p>
    <ul>
        <li><strong>HTTP/2 Transport:</strong> Enables multiplexing (sending multiple requests over a single TCP connection), header compression, and bidirectional streaming.</li>
        <li><strong>Binary Serialization:</strong> Uses Protocol Buffers (Protobuf) instead of JSON text, reducing payload sizes and CPU serialization overhead.</li>
        <li><strong>Strict Contracts:</strong> Service methods and data types are defined in <code>.proto</code> files and compiled into strongly typed code in multiple languages.</li>
    </ul>
    <!-- pagebreak -->
    <h2>gRPC Streaming Models</h2>
    <p>gRPC supports four client-server communication models:</p>
    <ul>
        <li><strong>Unary:</strong> Standard request-response pattern.</li>
        <li><strong>Server Streaming:</strong> The client sends one request, and the server returns a stream of responses (e.g. live server logs, streaming stock prices).</li>
        <li><strong>Client Streaming:</strong> The client sends a stream of requests, and the server returns a single response (e.g. bulk file uploads).</li>
        <li><strong>Bidirectional Streaming:</strong> Both client and server send streams of messages concurrently over a single connection (e.g. chat applications, video calls).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Protocol Buffers: Binary Serialization</h2>
    <p>Protocol Buffers (Protobuf) is a language-neutral, platform-neutral binary serialization format. It compiles schemas into compact binary payloads by replacing string key names with numeric tag identifiers:</p>
    <div class="uml-text-box">
JSON Payload (73 Bytes):
{"userId": 1209, "email": "user@test.com", "role": "admin"}

Protobuf Binary Payload (24 Bytes):
08 b9 09 12 0d 75 73 65 72 40 74 65 73 74 2e 63 6f 6d 1a 05 61 64 6d 69 6e
    </div>
    <p>This compact representation reduces network bandwidth and CPU cycles needed for serialization, making it ideal for high-throughput microservices.</p>
            `,
        visualizer: {"type": "api-comparison", "title": "API Format Sizes", "desc": "Compare packet overheads."},
        quiz: [
            {
                question: "Which API protocol relies on HTTP/2 multiplexing streams and Protobuf binary serialization?",
                options: [
                    "RESTful API",
                    "GraphQL",
                    "gRPC",
                    "SOAP",
                ],
                answer: 2,
                explanation: "gRPC leverages HTTP/2 features and Protocol Buffers to serialize data into low-latency binary streams."
            },
        ]
    },
    {
        id: "database-design",
        title: "Database Design, Indexing & Sharding",
        category: "Data & Communication",
        content: `
    <h1>Database Design, Indexing & Sharding</h1>
    <h2>SQL vs. NoSQL Design Trade-offs</h2>
    <p>Selecting database storage options requires understanding ACID vs. BASE design paradigms:</p>
    <ul>
        <li><strong>ACID (SQL):</strong> Atomicity, Consistency, Isolation, Durability. Focuses on strict data integrity. Changes are written synchronously to transaction logs. Best for financial accounts, inventory tables.</li>
        <li><strong>BASE (NoSQL):</strong> Basically Available, Soft state, Eventual consistency. Prioritizes scaling and availability over instant consistency. Replicates data asynchronously in the background. Best for social feeds, clickstream logs, user tracking.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Clustered vs. Non-Clustered Indexes</h2>
    <p>Indexes speed up read operations. SQL databases support two primary index types:</p>
    <ul>
        <li><strong>Clustered Index:</strong> Dictates the physical order of rows on disk. A table can have only one clustered index (typically the Primary Key). Queries using it do not require secondary lookups.</li>
        <li><strong>Non-Clustered Index:</strong> Creates a separate sorted pointer structure. It maps indexed column keys to the primary key values. A table can have multiple non-clustered indexes, but queries require an extra lookup step to retrieve the full row.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Index Data Structures: B-Trees and B+ Trees</h2>
    <p>Relational databases use B+ Trees to index table data:</p>
    <ul>
        <li><strong>Balance:</strong> Self-balancing tree structures. Ensure logarithmic read, insert, and delete times (<code>O(log N)</code>).</li>
        <li><strong>B+ Tree Design:</strong>
            <ul>
                <li>Intermediate nodes store search keys only, not data payloads. This increases the tree's **fan-out** (node capacity), keeping the tree shallow.</li>
                <li>Data records (or pointers) are stored exclusively in leaf nodes.</li>
                <li>Leaf nodes are linked together sequentially. This enables efficient range scans without traversing parent nodes.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Write-Optimized Indexes: LSM-Trees</h2>
    <p>B+ Trees perform random writes on disk, which degrades write speeds. NoSQL databases (like Cassandra) use **Log-Structured Merge-Trees (LSM-Trees)** for fast write paths:</p>
    <ol>
        <li>Writes are appended sequentially to an in-memory sorted skip-list buffer called a **MemTable**.</li>
        <li>Updates are also written to a sequential Commit Log on disk for durability.</li>
        <li>When the MemTable fills, its sorted keys are flushed to disk as immutable sorted logs called **SSTables (Sorted String Tables)**.</li>
        <li>Background **Compaction** processes merge SSTables and remove overwritten or deleted values.</li>
    </ol>
    <!-- pagebreak -->
    <h2>NoSQL Data Models</h2>
    <p>NoSQL databases prioritize horizontal scaling by grouping data by access patterns:</p>
    <ul>
        <li><strong>Key-Value Stores:</strong> Ultra-fast lookups (e.g. Redis). Hash map interface.</li>
        <li><strong>Document Stores:</strong> Store documents as nested JSON schemas (e.g. MongoDB). Map data directly to application objects.</li>
        <li><strong>Wide-Column Stores:</strong> Multi-dimensional sorted maps (e.g. Cassandra). Store columns together on disk, allowing rapid aggregation queries on large datasets.</li>
        <li><strong>Graph Databases:</strong> Map entities as Nodes and relationships as Edges (e.g. Neo4j). Optimized for traversing complex connections (like friend graphs or recommendation engines).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Database Sharding (Horizontal Partitioning)</h2>
    <p>When a database grows too large for a single server, you must shard it. **Sharding** splits table rows across separate database servers (shards):</p>
    <ul>
        <li><strong>Sharding Key:</strong> The column used to determine where a row is stored (e.g., <code>tenant_id</code>).</li>
        <li><strong>Goal:</strong> Select a high-cardinality sharding key to distribute read and write traffic evenly across all shards, preventing bottlenecks.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Sharding Strategies</h2>
    <p>Database systems route queries to shards using different partitioning algorithms:</p>
    <ul>
        <li><strong>Range-Based Sharding:</strong> Maps data ranges to shards (e.g., names A-E to Shard 1, F-L to Shard 2). Easy to implement, but prone to uneven load distribution.</li>
        <li><strong>Directory-Based Sharding:</strong> Uses a lookup service to map sharding keys to target database nodes. Provides flexibility, but introduces a single point of failure and query latency.</li>
        <li><strong>Hash-Based Sharding:</strong> Applies a hash function to the sharding key modulo the number of shards (<code>shard_id = hash(key) % N</code>). Distributes keys evenly, but makes cluster resizing complex.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Sharding Pitfalls & Challenges</h2>
    <p>Sharding introduces significant operational complexity:</p>
    <ul>
        <li><strong>No Cross-Shard Joins:</strong> SQL JOIN queries across multiple shards are slow and complex. Developers must denormalize schemas to avoid cross-shard operations.</li>
        <li><strong>Transaction Boundaries:</strong> Enforcing ACID transactions across shards requires distributed transaction protocols like **Two-Phase Commit (2PC)**, which increases write latency.</li>
        <li><strong>Hotspots:</strong> Unbalanced traffic to a single shard key (e.g. sharding posts by user ID, where a celebrity post overloads their assigned shard).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Database Consensus Protocols</h2>
    <p>To keep replicated database nodes in sync, systems run consensus protocols to agree on the state of writes. Paxos and Raft elect a cluster leader that coordinates updates, ensuring consistent replication despite hardware failures. This consensus model is the foundation of modern distributed SQL databases like Google Spanner and CockroachDB.</p>
            `,
        visualizer: {"type": "sharding-calc", "title": "Consistent Hash Sharder", "desc": "Map users to shards."},
        quiz: [
            {
                question: "Which indexing structure is optimized for fast write operations by caching writes in a MemTable and flushing them to SSTables?",
                options: [
                    "B+ Tree Index",
                    "LSM-Tree Index",
                    "Hash Index",
                    "Bitmap Index",
                ],
                answer: 1,
                explanation: "LSM-Trees append writes to in-memory MemTables and flush them sequentially to SSTables, optimizing write throughput."
            },
        ]
    },
    {
        id: "high-availability",
        title: "High Availability & Disaster Recovery",
        category: "Specialized Topics",
        content: `
    <h1>High Availability & Disaster Recovery</h1>
    <h2>Single Points of Failure (SPOF)</h2>
    <p>High Availability (HA) is the design goal of keeping a system operational and accessible despite component failures. A **Single Point of Failure (SPOF)** is any component in the infrastructure stack that, if it fails, brings down the entire system:</p>
    <div class="uml-text-box">
SPOF Design: [Web Server] ---> [Single Database Instance] (Fails -> Down)

HA Design:   [Web Server] ---> [Load Balancer] ---> [Primary DB] ---> [Replica DB]
    </div>
    <p>HA architectures eliminate SPOFs by building redundancy into every layer, including redundant network switches, load balancers, application server pools, and database replicas.</p>
    <!-- pagebreak -->
    <h2>Measuring Availability (The 'Nines')</h2>
    <p>System availability is measured as a percentage of uptime per year:</p>
    <ul>
        <li><strong>99.9% (Three Nines):</strong> ~8.76 hours of downtime/year.</li>
        <li><strong>99.99% (Four Nines):</strong> ~52.56 minutes of downtime/year.</li>
        <li><strong>99.999% (Five Nines):</strong> ~5.26 minutes of downtime/year. (High-Availability standard).</li>
    </ul>
    <p><strong>Availability Math:</strong>
        <ul>
            <li>For serial systems (if component A AND B must work): <code>Total Availability = Avail(A) * Avail(B)</code>. (Availability decreases).</li>
            <li>For parallel systems (redundant nodes, A OR B must work): <code>Total Availability = 1 - (1 - Avail(A)) * (1 - Avail(B))</code>. (Availability increases).</li>
        </ul>
    </p>
    <!-- pagebreak -->
    <h2>Failover Strategies</h2>
    <p>When a server fails, traffic must be routed to healthy nodes using failover strategies:</p>
    <ul>
        <li><strong>Active-Active:</strong> Multiple servers process requests simultaneously. If one server goes offline, load balancers stop routing traffic to it, and the remaining nodes absorb the load.</li>
        <li><strong>Active-Passive:</strong> One active server processes traffic, while passive (standby) servers replicate data in the background. If the active server crashes, a passive node is promoted to active.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Heartbeats & Split-Brain Scenarios</h2>
    <p>Failover systems use **Heartbeat Monitors** (regular health check ping packets sent between servers) to verify node health. If pings fail, a failover is triggered.</p>
    <p><strong>Split-Brain Scenario:</strong> If a network partition cuts communication between active and passive nodes, the passive node might assume the active node has crashed and promote itself. Both nodes become active writes coordinators, causing data divergence. Failover systems prevent this using **Fencing (Node Isolation)** and consensus quorum checks.</p>
    <!-- pagebreak -->
    <h2>Replication Lag & Read Scaling</h2>
    <p>To scale reads, databases route queries to read replicas. However, asynchronous replication introduces **Replication Lag** (the delay before updates are committed to replicas):</p>
    <ul>
        <li><strong>Issue:</strong> If a user updates their profile and immediately refreshes the page, the read query might hit a lagging replica, showing their old data (stale read).</li>
        <li><strong>Mitigation:</strong> Implement **Read-Your-Own-Writes**. Route read requests for recently updated profiles to the master database for a short window, or use synchronous replication for critical writes.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Disaster Recovery Strategies</h2>
    <p>Disaster Recovery (DR) describes the policies and procedures to restore system operations after a catastrophic outage (e.g., datacenter destruction by natural disasters):</p>
    <ul>
        <li><strong>Multi-Region Replication:</strong> Replicating database instances and static assets across separate geographic cloud regions.</li>
        <li><strong>DR Deployment Patterns:</strong>
            <ul>
                <li>*Pilot Light:* Core databases are replicated to a standby region, while application servers remain off. In a disaster, the standby region is booted up.</li>
                <li>*Warm Standby:* Application servers in the standby region run at a reduced scale, ready to scale up immediately.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Disaster Recovery Metrics: RPO and RTO</h2>
    <p>DR plans are designed around two targets:</p>
    <ul>
        <li><strong>RPO (Recovery Point Objective):</strong> The maximum acceptable age of data lost due to an outage (e.g., if RPO is 1 hour, you must perform backups at least hourly).</li>
        <li><strong>RTO (Recovery Time Objective):</strong> The maximum acceptable duration of downtime before system recovery (e.g., if RTO is 15 minutes, you must automate failovers to restore services quickly).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Chaos Engineering</h2>
    <p>Chaos Engineering is the practice of intentionally introducing failures in production systems to verify resiliency:</p>
    <ul>
        <li><strong>Concept:</strong> Developed by Netflix (with Chaos Monkey) to verify that the streaming platform could tolerate instance failures without interrupting video playback.</li>
        <li><strong>Execution:</strong> Automatically shuts down active instances, injects network packet delays, or drops database replica connections in production to test if the system degrades gracefully.</li>
    </ul>
            `,
        visualizer: {"type": "active-passive", "title": "Active-Passive Failover", "desc": "Trigger server crashes."},
        quiz: [
            {
                question: "What is the term for the maximum acceptable age of transactions lost during a recovery event?",
                options: [
                    "RTO",
                    "RPO",
                    "SLA",
                    "SLO",
                ],
                answer: 1,
                explanation: "RPO (Recovery Point Objective) defines the maximum target time window of acceptable data loss."
            },
        ]
    },
    {
        id: "design-patterns",
        title: "Design Patterns",
        category: "Specialized Topics",
        content: `
    <h1>Design Patterns</h1>
    <h2>SOLID Principles</h2>
    <p>SOLID represents five object-oriented design principles for writing clean, maintainable, and extensible code:</p>
    <ul>
        <li><strong>Single Responsibility:</strong> A class should have only one reason to change.</li>
        <li><strong>Open/Closed:</strong> Classes should be open for extension but closed for modification.</li>
        <li><strong>Liskov Substitution:</strong> Subtypes must be substitutable for their base types without breaking the application.</li>
        <li><strong>Interface Segregation:</strong> Avoid forcing classes to implement interface methods they do not use. Prefer multiple small interfaces over one large one.</li>
        <li><strong>Dependency Inversion:</strong> Depend on abstractions (interfaces) rather than concrete implementations.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Creational Patterns: Singleton & Prototype</h2>
    <p>Creational patterns manage object instantiation:</p>
    <ul>
        <li><strong>Singleton:</strong> Restricts a class to a single instance and provides a global access point to it (e.g., database connection pool). Must handle thread safety during creation using double-checked locking:</li>
    </ul>
    <pre><code>public class DatabaseConnection {
    private static volatile DatabaseConnection instance;
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnection.class) {
                if (instance == null) { instance = new DatabaseConnection(); }
            }
        }
        return instance;
    }
}</code></pre>
    <!-- pagebreak -->
    <h2>Creational Patterns: Factory Method & Builder</h2>
    <ul>
        <li><strong>Factory Method:</strong> Defines an interface for creating objects in a superclass, but allows subclasses to alter the type of objects created (e.g. creating payment processors dynamically based on region).</li>
        <li><strong>Builder Pattern:</strong> Separates the construction of a complex object from its representation, allowing step-by-step construction. Essential when objects require many optional parameters:</li>
    </ul>
    <pre><code>User user = new User.Builder()
    .setName("Alice")
    .setEmail("alice@test.com")
    .setAge(25)
    .build();</code></pre>
    <!-- pagebreak -->
    <h2>Structural Patterns: Adapter & Composite</h2>
    <p>Structural patterns focus on combining classes and objects into larger structures:</p>
    <ul>
        <li><strong>Adapter:</strong> Acts as a wrapper, converting the interface of a class into another interface that clients expect (e.g., wrapping a legacy XML API to return JSON data).</li>
        <li><strong>Composite:</strong> Composes objects into tree structures to represent part-whole hierarchies, treating individual objects and compositions uniformly (e.g., file system directory structures).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Structural Patterns: Proxy, Facade, & Decorator</h2>
    <ul>
        <li><strong>Proxy:</strong> Provides a surrogate or placeholder object to control access to the original object (e.g., lazy loading database queries, caching results, logging actions).</li>
        <li><strong>Facade:</strong> Provides a simplified interface to a complex set of classes or subsystem (e.g., a checkout facade wrapping inventory check, payment processing, and shipping).</li>
        <li><strong>Decorator:</strong> Dynamically attaches new behaviors to an object without modifying its structure (e.g., adding encryption or compression wrappers to a file stream).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Behavioral Patterns: Observer & Strategy</h2>
    <p>Behavioral patterns manage object communication and responsibilities:</p>
    <ul>
        <li><strong>Observer:</strong> Defines a one-to-many subscription mechanism to notify observer objects of any events in the subject they observe (the foundation of event-driven architectures).</li>
        <li><strong>Strategy:</strong> Defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime (e.g. changing sorting algorithms or shipping calculators based on inputs).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Behavioral Patterns: Command, State, & Chain of Responsibility</h2>
    <ul>
        <li><strong>Command:</strong> Encapsulates a request as an object, allowing you to parameterize clients with different requests, queue actions, and support undo operations.</li>
        <li><strong>State:</strong> Allows an object to alter its behavior when its internal state changes, behaving as if its class changed (e.g., Document processing workflow).</li>
        <li><strong>Chain of Responsibility:</strong> Passes a request along a chain of handlers. Each handler decides either to process the request or pass it to the next handler (e.g., HTTP request middleware pipelines).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Design Pattern Trade-offs</h2>
    <p>While design patterns provide reusable solutions, they introduce trade-offs:</p>
    <ul>
        <li><strong>Over-Engineering:</strong> Applying patterns when simple logic is sufficient increases code complexity.</li>
        <li><strong>Boilerplate Code:</strong> Patterns like Abstract Factory require writing multiple interfaces and factory classes, which can complicate simple designs.</li>
    </ul>
            `,
        visualizer: {"type": "observer-pattern", "title": "Observer Pattern", "desc": "Broadcasting events."},
        quiz: [
            {
                question: "Which design pattern is best for wrapping incompatible interfaces to make them cooperate?",
                options: [
                    "Proxy Pattern",
                    "Facade Pattern",
                    "Adapter Pattern",
                    "Decorator Pattern",
                ],
                answer: 2,
                explanation: "The Adapter pattern converts the interface of a class to match what the client expects."
            },
        ]
    },
    {
        id: "security-architecture",
        title: "Security Architecture",
        category: "Specialized Topics",
        content: `
    <h1>Security Architecture</h1>
    <h2>The CIA Triad & Threat Modeling</h2>
    <p>Security is a fundamental design requirement. System security is built around the **CIA Triad**:</p>
    <ul>
        <li><strong>Confidentiality:</strong> Ensuring data is accessible only to authorized users. (Achieved via encryption, access controls).</li>
        <li><strong>Integrity:</strong> Ensuring data remains accurate and unaltered during transit and storage. (Achieved via cryptographic signatures, checksums).</li>
        <li><strong>Availability:</strong> Ensuring authorized users have reliable access to systems. (Achieved via DDoS protection, failover redundancy).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Authentication vs. Authorization</h2>
    <p>These two security boundaries are distinct:</p>
    <ul>
        <li><strong>Authentication (AuthN):</strong> Verifying **who** the user is (e.g., verifying a password, MFA codes, biometric scans, or SSO assertions).</li>
        <li><strong>Authorization (AuthZ):</strong> Verifying **what** the authenticated user is allowed to do. Occurs after AuthN (e.g. determining if a user can edit a document).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Access Control Models: RBAC vs. ABAC</h2>
    <p>Authorization is enforced using access control frameworks:</p>
    <ul>
        <li><strong>RBAC (Role-Based Access Control):</strong> Permissions are mapped to generic roles (e.g., <code>Admin</code>, <code>Editor</code>, <code>Viewer</code>), and users are assigned to roles. Easy to manage, but less granular.</li>
        <li><strong>ABAC (Attribute-Based Access Control):</strong> Permissions are evaluated dynamically using attributes of the user, resource, and environment (e.g. "Only allow users in the HR department to read salary files during working hours"). High granularity, but complex to configure.</li>
    </ul>
    <!-- pagebreak -->
    <h2>JWT Session Management</h2>
    <p>JSON Web Tokens (JWT) enable stateless user sessions:</p>
    <ul>
        <li><strong>Structure:</strong> Composed of three parts separated by dots: <strong>Header</strong> (defines algorithm), <strong>Payload</strong> (user claims, expiration), and <strong>Signature</strong> (verifies authenticity).</li>
        <li><strong>Verification:</strong> The server verifies the token signature using a secret key, avoiding database lookups.</li>
        <li><strong>Revocation:</strong> Because they are stateless, JWTs cannot be revoked easily before they expire.
            <ul>
                <li><em>Mitigation:</em> Maintain a Redis blacklist of revoked token IDs (jti) with a TTL matching the token's expiration window.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>OAuth 2.0 Delegation Flow</h2>
    <p>OAuth 2.0 is a delegation framework that allows applications to obtain limited access to user accounts on an HTTP service without exposing credentials:</p>
    <div class="uml-text-box">
App ---> Redirect User to Google ---> User Authorizes
 |                                           |
 |<-- Auth Code (Temporary) -----------------+
 v
App ---> Exchange Code + Secret ---> Google Auth Server ---> Access Token
    </div>
    <p>The **Authorization Code Grant** is the recommended flow for web applications. The code exchange happens server-to-server, protecting the access token from exposure in the client browser.</p>
    <!-- pagebreak -->
    <h2>Network Security: Firewalls, DMZs, & WAFs</h2>
    <p>Protecting infrastructure requires layered network security:</p>
    <ul>
        <li><strong>DMZ (Demilitarized Zone):</strong> A subnetwork that exposes external-facing services (e.g., reverse proxies, load balancers) to the internet, while keeping application services and databases isolated in private networks.</li>
        <li><strong>WAF (Web Application Firewall):</strong> Monitors and filters Layer 7 HTTP traffic, blocking attacks like SQL injections, Cross-Site Scripting (XSS), and automated bot traffic.</li>
    </ul>
    <!-- pagebreak -->
    <h2>OWASP Application Vulnerabilities</h2>
    <p>Application architectures must defend against common vulnerabilities:</p>
    <ul>
        <li><strong>SQL Injection (SQLi):</strong> Attackers execute arbitrary database commands by injecting malicious inputs. *Defense:* Use Prepared Statements (parameterized queries).</li>
        <li><strong>Cross-Site Scripting (XSS):</strong> Injecting malicious scripts into web pages viewed by other users. *Defense:* Sanitize user inputs and set a strict Content Security Policy (CSP).</li>
        <li><strong>CSRF (Cross-Site Request Forgery):</strong> Forcing authenticated users to execute unwanted actions on a trusted site. *Defense:* Use anti-CSRF tokens and set cookie attributes to <code>SameSite=Strict</code>.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Symmetric vs. Asymmetric Encryption</h2>
    <p>Encryption protects data in transit and at rest:</p>
    <ul>
        <li><strong>Symmetric Encryption (e.g. AES):</strong> Uses the same key for encryption and decryption. Fast, used to encrypt large payloads (e.g. database columns, files).</li>
        <li><strong>Asymmetric Encryption (e.g. RSA):</strong> Uses a Public Key to encrypt and a Private Key to decrypt. Slow, used for identity verification and exchanging symmetric keys during TLS handshakes.</li>
    </ul>
            `,
        visualizer: {"type": "jwt-visualizer", "title": "JWT Parser", "desc": "Deconstruct JWT elements."},
        quiz: [
            {
                question: "Which rate limiting algorithm adds tokens to a bucket at a fixed rate, allowing traffic bursts?",
                options: [
                    "Leaky Bucket",
                    "Token Bucket",
                    "Fixed Window Counter",
                    "Sliding Window Log",
                ],
                answer: 1,
                explanation: "The Token Bucket algorithm accumulates tokens up to a maximum limit, allowing short bursts of requests."
            },
        ]
    },
    {
        id: "cloud-architecture",
        title: "Cloud Architecture — AWS, GCP & Azure",
        category: "Specialized Topics",
        content: `
    <h1>Cloud Architecture — AWS, GCP & Azure</h1>
    <h2>Cloud Computing Paradigms</h2>
    <p>Cloud service models determine the division of operational responsibilities between you and the cloud provider:</p>
    <ul>
        <li><strong>IaaS (Infrastructure as a Service - e.g. EC2, VMs):</strong> The provider hosts physical hardware; you manage operating systems, runtimes, updates, and application code.</li>
        <li><strong>PaaS (Platform as a Service - e.g. Heroku, Elastic Beanstalk):</strong> The provider manages operating systems and scaling; you upload application code.</li>
        <li><strong>SaaS (Software as a Service - e.g. Microsoft 365, Salesforce):</strong> End-user software managed entirely by the provider.</li>
        <li><strong>FaaS (Function as a Service - e.g. Lambda, Cloud Functions):</strong> Ephemeral, event-triggered functions managed by the provider.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Cloud Provider Resource Mapping</h2>
    <p>Architects must map equivalent services across major cloud platforms:</p>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>AWS</th>
                <th>GCP</th>
                <th>Azure</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Virtual Machines</td>
                <td>EC2</td>
                <td>Compute Engine</td>
                <td>Virtual Machines</td>
            </tr>
            <tr>
                <td>Managed Kubernetes</td>
                <td>EKS</td>
                <td>GKE</td>
                <td>AKS</td>
            </tr>
            <tr>
                <td>Object Storage</td>
                <td>S3</td>
                <td>Cloud Storage</td>
                <td>Blob Storage</td>
            </tr>
            <tr>
                <td>Relational Cluster</td>
                <td>Aurora DB</td>
                <td>Cloud Spanner</td>
                <td>Azure Cosmos DB (SQL)</td>
            </tr>
            <tr>
                <td>Content Delivery</td>
                <td>CloudFront</td>
                <td>Cloud CDN</td>
                <td>Azure CDN</td>
            </tr>
        </tbody>
    </table>
    <!-- pagebreak -->
    <h2>Multi-Region High Availability Designs</h2>
    <p>To survive region-wide outages, architectures deploy services across multiple geographic cloud regions:</p>
    <ul>
        <li><strong>Active-Passive Multi-Region:</strong> Primary region handles all writes and reads. In a disaster, global DNS routes traffic to the standby secondary region.</li>
        <li><strong>Active-Active Multi-Region:</strong> Both regions process traffic concurrently. Requires a globally distributed database (e.g. Google Cloud Spanner) to resolve write conflicts and prevent data inconsistency.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Cloud Networking: Subnets & Route Tables</h2>
    <p>Networking in the cloud mirrors physical network topologies using software-defined configurations:</p>
    <ul>
        <li><strong>VPC (Virtual Private Cloud):</strong> Isolated logical network partitions.</li>
        <li><strong>Subnets:</strong> CIDR IP ranges within a VPC.
            <ul>
                <li>*Public Subnet:* Route table directs <code>0.0.0.0/0</code> (all internet traffic) to an Internet Gateway.</li>
                <li>*Private Subnet:* Route table directs outbound internet traffic to a NAT Gateway located in the public subnet.</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Cloud Security: IAM Policies</h2>
    <p>Cloud resource access is controlled using IAM (Identity and Access Management) systems:</p>
    <ul>
        <li><strong>Role-Based Access:</strong> Instead of embedding API credentials inside code, attach an IAM Role to your virtual machine or container pod, allowing it to request temporary security tokens.</li>
        <li><strong>Principle of Least Privilege:</strong> Limit access permissions strictly to what is required (e.g. write access only to a specific storage bucket path, rather than full admin access).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Container Orchestration: Kubernetes vs. ECS</h2>
    <p>At scale, managing thousands of container instances requires an orchestration platform:</p>
    <ul>
        <li><strong>Kubernetes:</strong> Open-source, highly extensible container orchestrator. Manages service discovery, self-healing, rolling updates, and storage configurations. Avoids vendor lock-in.</li>
        <li><strong>ECS (Elastic Container Service):</strong> AWS-native container orchestrator. Simpler to set up than Kubernetes, but pins your architecture to AWS infrastructure.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Autoscaling Dynamics</h2>
    <p>Autoscaling adjusts compute resources based on real-time traffic demand:</p>
    <ul>
        <li><strong>Scale-Out (Horizontal):</strong> Adding container replicas or virtual machine instances when metrics exceed targets (e.g., average CPU utilization > 70% for 5 minutes).</li>
        <li><strong>Scale-Down Cooldowns:</strong> Delaying server termination when traffic drops to prevent rapid scaling cycles ("flapping").</li>
    </ul>
    <!-- pagebreak -->
    <h2>Cloud Cost Management</h2>
    <p>Cloud systems design requires cost optimization:</p>
    <ul>
        <li><strong>Spot Instances:</strong> Spare cloud compute capacity sold at deep discounts (up to 90%). Prone to termination with short notice; best for stateless worker pools and background batch jobs.</li>
        <li><strong>Reserved Instances:</strong> Committing to a resource contract for 1-3 years in exchange for discounted rates. Best for predictable baseline workloads.</li>
    </ul>
            `,
        visualizer: {"type": "cloud-calculator", "title": "Cloud Map", "desc": "Equivalency table."},
        quiz: [
            {
                question: "What is an isolated virtual network partition inside public cloud providers called?",
                options: [
                    "Subnet",
                    "VPC (Virtual Private Cloud)",
                    "Availability Zone",
                    "Bastion Host",
                ],
                answer: 1,
                explanation: "A VPC (Virtual Private Cloud) is a logically isolated virtual network allocated to a single cloud account."
            },
        ]
    },
    {
        id: "case-studies",
        title: "System Design Case Studies",
        category: "Real-World Systems",
        content: `
    <h1>System Design Case Studies</h1>
    <h2>Case Study: Facebook News Feed Scale</h2>
    <p>Facebook must generate timelines for billions of active users. A naive approach (querying all user friends, fetching their posts, and sorting by timestamp on-demand) is too slow. The feed generation pipeline must optimize reads using pre-computed caching.</p>
    <!-- pagebreak -->
    <h2>News Feed Generation: Push vs. Pull</h2>
    <p>Feed generation systems use a hybrid Fan-out approach to handle differing user profiles:</p>
    <ul>
        <li><strong>Fan-out-on-Write (Push):</strong> When a standard user publishes a post, the system appends the post ID to the home feed cache of all their followers in Redis.
            <ul>
                <li><em>Benefit:</em> Fast reads. Retrieving a feed is a simple index lookup.</li>
            </ul>
        </li>
        <li><strong>Fan-out-on-Read (Pull):</strong> When a user with millions of followers (a celebrity) posts, the system does not push it. Instead, followers query and merge celebrity posts on-demand when loading their feed.
            <ul>
                <li><em>Benefit:</em> Avoids write amplification spikes (e.g. pushing a post to 80 million followers at once).</li>
            </ul>
        </li>
    </ul>
    <!-- pagebreak -->
    <h2>Case Study: YouTube Video Transcoding Pipeline</h2>
    <p>YouTube processes massive volumes of video uploads daily. Raw video files are large and must be transcoded into multiple formats and resolutions to support varying client devices and network speeds.</p>
    <!-- pagebreak -->
    <h2>Video Transcoding: Chunking & Caching</h2>
    <p>YouTube optimizes video ingestion and delivery using chunking pipelines:</p>
    <ul>
        <li><strong>Chunk-Based Transcoding:</strong> Uploaded video files are split into small 5-second segments. These segments are transcoded in parallel across worker servers, reducing processing times.</li>
        <li><strong>Adaptive Bitrate Streaming (HLS/DASH):</strong> Players detect client network speeds and dynamically request appropriate video resolutions chunk-by-chunk. This prevents video playback buffering.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Case Study: Uber Dispatch (Geospatial Scale)</h2>
    <p>Uber matches passengers with nearby drivers in real-time. This requires tracking location coordinates (latitude and longitude) for millions of active drivers and processing queries for nearby entities every second.</p>
    <!-- pagebreak -->
    <h2>Uber: Geospatial Indexing</h2>
    <p>Traditional SQL databases are slow at processing 2D range queries (e.g., <code>SELECT * WHERE lat BETWEEN x AND y</code>). Uber solves this using geospatial indexes:</p>
    <ul>
        <li><strong>H3 Spatial Index:</strong> Divides the map of the earth into a hierarchical grid of hexagonal cells. Each cell has a unique 64-bit index ID.</li>
        <li><strong>In-Memory Registry:</strong> Active driver location updates are mapped to H3 cell indexes in memory. Finding nearby drivers is simplified to a lookup of adjacent hexagonal indexes.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Case Study: WhatsApp Chat Scale</h2>
    <p>WhatsApp manages millions of concurrent active chat connections. To support instant delivery, the architecture must support low-overhead bidirectional connections between clients and servers.</p>
    <!-- pagebreak -->
    <h2>WhatsApp: Persistent WebSockets</h2>
    <p>WhatsApp establishes persistent connections to coordinate messaging:</p>
    <ul>
        <li><strong>WebSockets:</strong> Establish persistent TCP connections, bypassing the HTTP request overhead for every message.</li>
        <li><strong>Erlang/OTP Concurrency:</strong> Erlang uses lightweight processes that run concurrently, allowing a single server node to manage millions of active socket connections in memory.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Case Study: Netflix Resilient Video Delivery</h2>
    <p>Netflix accounts for a significant portion of global downstream internet traffic. Streaming high-resolution video requires distributing load away from central database infrastructures.</p>
    <p><strong>Open Connect CDN:</strong> Netflix installs custom storage appliance servers inside local Internet Service Provider (ISP) facilities. Popular video files are cached on these appliances during off-peak hours, allowing users to stream video directly from their local ISP network.</p>
    <!-- pagebreak -->
    <h2>Case Study: Twitter Trending Topics</h2>
    <p>Twitter detects trending hashtags in real-time. This requires tracking millions of tweets in sliding time windows:</p>
    <ul>
        <li><strong>Sliding Window Counters:</strong> Counts tag frequencies inside a moving window (e.g. past 2 hours).</li>
        <li><strong>Hot Keys Mitigation:</strong> When a topic spikes, writing to a single counter creates database locks. Systems resolve this by split-counting across multiple nodes and aggregating results periodically in memory.</li>
    </ul>
            `,
        visualizer: {"type": "case-studies-selector", "title": "Blueprints", "desc": "Load study topologies."},
        quiz: [
            {
                question: "What geospatial index framework does Uber utilize to divide global maps into hexagons?",
                options: [
                    "Quadkey S2",
                    "H3 Spatial Index",
                    "R-Tree Index",
                    "Geohash",
                ],
                answer: 1,
                explanation: "Uber uses the open-source H3 hexagonal spatial index grid to partition regions and coordinate dispatch."
            },
        ]
    },
    {
        id: "monitoring-observability",
        title: "Monitoring, Observability & Alerting",
        category: "Infrastructure & Cloud",
        content: `
    <h1>Monitoring, Observability & Alerting</h1>
    <h2>Black-Box Monitoring vs. White-Box Observability</h2>
    <p>Maintaining high availability at scale requires system visibility:</p>
    <ul>
        <li><strong>Black-Box Monitoring:</strong> Verifying system behavior from the outside (e.g. testing if an HTTP endpoint returns a 200 OK status code). Tells you *when* a system is failing.</li>
        <li><strong>White-Box Observability:</strong> Inspecting internal system metrics, logs, and traces. Tells you *why* a system is failing.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Metrics Systems & Prometheus</h2>
    <p>Metrics are numeric measurements aggregated over time. The four primary metric types are:</p>
    <ul>
        <li><strong>Counter:</strong> A cumulative metric that only increases or resets to zero (e.g., total requests handled).</li>
        <li><strong>Gauge:</strong> A single numerical value that can go up and down (e.g., current memory usage, thread count).</li>
        <li><strong>Histogram:</strong> Samples observations (like request duration) and counts them in configurable buckets. Used to calculate latencies.</li>
    </ul>
    <p><strong>Prometheus Pull Model:</strong> The Prometheus monitoring server scrapes metrics by making regular HTTP calls to client endpoints (like <code>/metrics</code>), which exposes metrics data in a simple text format.</p>
    <!-- pagebreak -->
    <h2>Log Aggregation</h2>
    <p>Logs record application events. At scale, searching text files across thousands of servers is slow. Architectures collect and index logs centrally using logging stacks:</p>
    <ul>
        <li><strong>ELK Stack:</strong> Logstash collects logs, Elasticsearch indexes them for text search, and Kibana visualizes log data.</li>
        <li><strong>Structured Logs:</strong> Writing logs as structured JSON (e.g. <code>{"timestamp": "12:00:00", "level": "ERROR", "message": "DB Timeout", "traceId": "0x12"}</code>) instead of flat text makes parsing and filtering operations faster.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Distributed Tracing</h2>
    <p>In microservice architectures, a single client request can touch multiple services. If a request is slow, distributed tracing tracks its path through the system:</p>
    <ul>
        <li><strong>Trace ID:</strong> A unique identifier generated at the API Gateway and passed in HTTP headers to all downstream services.</li>
        <li><strong>Span ID:</strong> A segment ID created by each service to record start and end times for local operations (e.g., database queries, caching lookups).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Service Level Indicators (SLIs) & Objectives (SLOs)</h2>
    <p>SRE teams use metric frameworks to define system performance targets:</p>
    <ul>
        <li><strong>SLI (Service Level Indicator):</strong> A quantitative measurement of service performance (e.g., <code>Latency = percentage of requests completed in < 200ms</code>).</li>
        <li><strong>SLO (Service Level Objective):</strong> The target reliability goal agreed upon by engineering and product teams (e.g., <code>SLI must be >= 99% over 30 days</code>).</li>
    </ul>
    <!-- pagebreak -->
    <h2>Service Level Agreements (SLAs) & Error Budgets</h2>
    <ul>
        <li><strong>SLA (Service Level Agreement):</strong> A legal contract with customers specifying service guarantees and financial penalties if those guarantees are breached (e.g. refunding credits if availability drops below 99.9%).</li>
        <li><strong>Error Budget:</strong> The fraction of time a system is allowed to be unreliable (e.g. a 99.9% availability SLO leaves a 0.1% error budget). If the budget is exhausted, deployments are frozen to focus resources on reliability.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Alerting Policies</h2>
    <p>Alerting systems notify on-call engineers when thresholds are breached. Alerting policies are designed to balance visibility against page fatigue:</p>
    <ul>
        <li><strong>Symptom-Based Alerting:</strong> Alert only when customer-facing SLOs are breached (e.g., high error rates). Avoid paging on-call engineers for internal resource spikes (e.g., high CPU on a single node) if the system is auto-scaling and degrading gracefully.</li>
        <li><strong>PagerDuty Integration:</strong> Routes critical alerts to on-call engineers based on roster schedules.</li>
    </ul>
    <!-- pagebreak -->
    <h2>Incident Response</h2>
    <p>When an outage occurs, on-call teams follow structured incident response procedures:</p>
    <ul>
        <li><strong>Runbooks:</strong> Documented guides detailing step-by-step procedures to mitigate common failure scenarios (e.g., database failovers, cache flushes).</li>
        <li><strong>Post-Mortems:</strong> Blameless reviews written after an outage to identify root causes, document timelines, and outline action items to prevent future occurrences.</li>
    </ul>
            `,
        visualizer: {"type": "observability-flow", "title": "Observability", "desc": "Mitigate server load spikes."},
        quiz: [
            {
                question: "What are the trace IDs and span IDs passed in downstream headers used to implement?",
                options: [
                    "Log Aggregation",
                    "Distributed Tracing",
                    "Metrics Scrapes",
                    "Anomaly Alerts",
                ],
                answer: 1,
                explanation: "Distributed tracing propagates Trace and Span IDs in headers to reconstruct request execution timelines across microservices."
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
