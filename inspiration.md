# Project Story: CityPulse - AI-powered Geospatial Discovery Search

## Inspiration

The idea for CityPulse came from a simple yet frustrating experience we've all had: arriving in a new city or even exploring our own neighborhood and wondering "What's actually happening around me right now?" Traditional search engines give you generic results, review sites show outdated information, and social media is too noisy to filter through.

I realized that in 2025, despite having powerful AI and real-time data, there wasn't a simple way to ask "What should I do near me right now?" and get intelligent, personalized, up-to-date answers. When Perplexity announced their hackathon, I saw the perfect opportunity to build the hyper-local discovery platform I always wanted to use.

## What it does

CityPulse is an AI-powered local discovery platform that answers the question "What's happening around me?" in real-time. 

The app automatically detects your location and offers multiple ways to discover local content:
- **Discover instantly**: Get live events, restaurants, and local alerts with one click
- **Search naturally**: Ask questions like "coffee shops with wifi" or "live music tonight" 
- **Get AI insights**: Receive personalized recommendations on what to try, when to visit, and what to avoid
- **Explore categories**: Quick buttons for activities, attractions, food, shopping, and local news
- **Share discoveries**: Generate links to share interesting places with friends
- **Navigate seamlessly**: Direct integration with maps apps for easy directions

The magic happens through Perplexity's real-time AI, which understands context, provides current information, and reasons about what would be most relevant for each user's specific situation.

## How I built it

I built CityPulse using a modern, AI-first architecture:

**Backend**: FastHTML with Python provided rapid development capabilities. I integrated Perplexity's API with multiple endpoints - using the standard Sonar model for real-time information retrieval and Sonar Reasoning for personalized insights. I implemented structured JSON schema validation to ensure consistent data formatting.

**Frontend**: Vanilla JavaScript with Google Maps API for interactive mapping, Bootstrap 5 for responsive design, and custom CSS for enhanced user experience. I focused on progressive enhancement with loading states and smooth animations.

**AI Integration**: The core innovation was leveraging Perplexity's real-time capabilities with location-aware prompts. I designed JSON schemas to structure responses into events, restaurants, and alerts, while implementing citation tracking for source verification.

I implemented multiple Perplexity API patterns:
- **Structured output** with JSON schemas for consistent data parsing
- **Real-time search** using Sonar models for current information
- **Reasoning capabilities** for personalized location insights
- **Geographic context** by passing coordinates to enhance local relevance

**Key Technical Decisions**:
- In-memory storage for sharing functionality (perfect for hackathon scope)
- Progressive enhancement with loading states for better UX
- Debounced search suggestions to balance responsiveness with API efficiency
- Mobile-first responsive design for real-world usage

**Data Flow**: User location → AI-powered search → Structured response → Interactive map visualization → Personalized insights on demand.

## Challenges I ran into

**API Response Parsing**: Perplexity's natural language responses needed careful parsing to extract structured data. I solved this by implementing JSON schema validation with intelligent fallbacks for when the AI returned slightly different formats.

**API Response Consistency**: Perplexity's responses needed careful prompt engineering to ensure consistent JSON formatting. I implemented retry logic and fallback parsing to handle edge cases.

**Real-time Performance**: Balancing instant user feedback with API rate limits required implementing smart debouncing, progress indicators, and caching strategies.

**Geographic Accuracy**: Getting precise location data and handling cases where Perplexity couldn't provide exact coordinates meant building fallback positioning and random scatter algorithms for visualization.

**UI State Management**: Managing the complex interactions between search, discovery, modals, and map updates in vanilla JavaScript required careful event handling and state synchronization.

**Mobile Experience**: Ensuring the map interactions, modals, and quick actions worked smoothly across different screen sizes and touch interfaces took significant testing and refinement.

## Accomplishments that I're proud of

**Seamless AI Integration**: I successfully created a natural interface where users don't feel like they're "talking to an AI" - they're just exploring their city. The AI works behind the scenes to provide intelligent, contextual results.

**Real-time Insights**: The personalized recommendation system using Perplexity's reasoning capabilities provides genuinely useful advice that goes beyond basic search results.

**Polished UX**: Despite the tight hackathon timeline, I achieved a professional-feeling interface with smooth animations, proper loading states, and intuitive interactions.

**Practical Utility**: CityPulse solves a real problem I face regularly. During development, I found myselve actually using it to discover new places around my own neighborhoods.

**Technical Innovation**: My approach to combining structured data extraction with AI reasoning creates a new pattern for location-based applications that other developers could build upon.

## What I learned

**AI-First Development**: Building with Perplexity taught me to think "AI-first" - designing the user experience around what AI does best (understanding context, reasoning about preferences) rather than forcing AI into traditional app patterns.

**Real-time Data Challenges**: Working with live information highlighted the complexity of data freshness, source reliability, and user expectation management in AI applications.

**Geographic Context Matters**: Location isn't just coordinates - it's cultural context, local customs, timing, and personal preferences. Perplexity's ability to understand this context was game-changing for my application.

**Rapid Prototyping with FastHTML**: I discovered that FastHTML's approach to full-stack development in Python dramatically accelerated my development cycle, letting me iterate on features in real-time.

**User Experience in AI Apps**: The most important part isn't the AI capability - it's making the AI invisible and focusing on solving the user's actual problem simply and elegantly.

## What's next for CityPulse - AI Geospatial Search

**Enhanced Personalization**: Implement user profiles that learn preferences over time, creating increasingly personalized recommendations based on past discoveries and feedback.

**Real-time Notifications**: Add push notifications for location-based alerts, new events in favorite areas, and personalized recommendations when entering new neighborhoods.

**Social Discovery**: Add community features where users can share discoveries, create location lists, and see what friends are exploring in real-time.

**Predictive Insights**: Use Perplexity's reasoning to predict what users might want to do next based on time, weather, location history, and local events.

**Multi-City Expansion**: Build city-specific knowledge bases and cultural context to provide even more relevant recommendations as users travel.

**Multi-modal AI**: Integrate image recognition for landmark identification and voice commands for hands-free exploration while walking.

**Business Integration**: Partner with local businesses to provide real-time availability, special offers, and direct booking capabilities.

**Advanced Filtering**: Implement sophisticated filters for accessibility, price range, group size, and activity type while maintaining the simple, natural search interface.

**Offline Capabilities**: Cache essential information for use when connectivity is limited, ensuring CityPulse works reliably in any exploration scenario.

CityPulse represents just the beginning of what's possible when you combine AI reasoning with real-time local data. I'm excited to continue building the future of urban exploration! 🌆