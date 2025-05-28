# Perplexity API
import os
import requests
from typing import List, Dict, Any, Optional

class PerplexityAPI:
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Perplexity API client."""
        self.api_key = api_key or os.environ.get("PERPLEXITY_API_KEY")
        if not self.api_key:
            raise ValueError("API key is required. Set PERPLEXITY_API_KEY environment variable or pass it directly.")
        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}
    
    def basic_query(self, prompt: str, model: str = "sonar-pro") -> str:
        """Send a basic query to the Perplexity API."""
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]
    
    def filtered_search(self, 
                        prompt: str, 
                        domain_filters: Optional[List[str]] = None,
                        model: str = "sonar-reasoning-pro") -> str:
        """Search with domain filters applied."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ]
        }
        
        if domain_filters:
            payload["search_domain_filter"] = domain_filters
            
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]
    
    def date_filtered_search(self,
                            prompt: str,
                            after_date: Optional[str] = None,
                            before_date: Optional[str] = None,
                            model: str = "sonar-pro") -> str:
        """Search with date filters applied."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an expert on current events."},
                {"role": "user", "content": prompt}
            ]
        }
        
        if after_date:
            payload["search_after_date_filter"] = after_date
        if before_date:
            payload["search_before_date_filter"] = before_date
            
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]
    
    def location_based_search(self,
                             prompt: str,
                             latitude: float,
                             longitude: float,
                             country: str,
                             model: str = "sonar-pro") -> str:
        """Search with location context."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a helpful local guide."},
                {"role": "user", "content": prompt}
            ],
            "web_search_options": {
                "user_location": {
                    "latitude": latitude,
                    "longitude": longitude,
                    "country": country
                }
            }
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]
    
    def image_search(self, 
                    prompt: str, 
                    return_images: bool = True,
                    image_domain_filter: Optional[List[str]] = None,
                    model: str = "sonar") -> str:
        """Search for images based on the prompt."""
        payload = {
            "model": model,
            "return_images": return_images,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        if image_domain_filter:
            payload["image_domain_filter"] = image_domain_filter
            
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]
    
    def analyze_image(self, 
                     prompt: str, 
                     image_url: str,
                     model: str = "sonar-pro") -> str:
        """Analyze an image with a text prompt."""
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ]
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]
    
    def structured_output(self, 
                         prompt: str, 
                         schema: Dict[str, Any],
                         model: str = "sonar") -> Dict:
        """Get a structured JSON response based on the provided schema."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": """Be precise and concise."""},
                {"role": "user", "content": prompt}
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"schema": schema}
            }
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        content = response["choices"][0]["message"]["content"]
        return content

    def geo_structured_output(self, 
                         prompt: str, 
                         schema: Dict[str, Any],
                         model: str = "sonar") -> Dict:
        """Get a structured JSON response based on the provided schema."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": 
                """
                You are an expert on current events and a real-time local discovery app for city exploration.

                We're building an app that helps people discover what's happening right around them, whether they're tourists or locals. The key features would be:

                1. Live local events (concerts, meetups, pop-ups happening now)
                2. Contextual business info (what's open, busy, or recommended nearby)
                3. Real-time alerts (weather, traffic, safety updates)
                4. Smart recommendations based on location and time
                
                Find current information near coordinates:
                
                1. EVENTS: Live events happening today/this week (concerts, festivals, sports, etc.)
                2. RESTAURANTS: Popular local restaurants and cafes currently open
                3. ALERTS: Any weather, traffic, or safety alerts for the area
                
                For each item, try to include specific addresses and approximate coordinates if possible.
                For every category, try to include at least 5 items.
                Return as JSON with events, restaurants, and alerts arrays.
                """
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"schema": schema}
            }
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        content = response["choices"][0]["message"]["content"]
        return content

    def geo_structured_output_with_citations(self, 
                     prompt: str, 
                     schema: Dict[str, Any],
                     model: str = "sonar") -> Dict:
        """Get a structured JSON response with detailed citations."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": 
                """
                You are an expert on current events and a real-time local discovery app for city exploration.

                We're building an app that helps people discover what's happening right around them, whether they're tourists or locals. The key features would be:

                1. Live local events (concerts, meetups, pop-ups happening now)
                2. Contextual business info (what's open, busy, or recommended nearby)
                3. Real-time alerts (weather, traffic, safety updates)
                4. Smart recommendations based on location and time
                
                Find current information near coordinates:
                
                1. EVENTS: Live events happening today/this week (concerts, festivals, sports, etc.)
                2. RESTAURANTS: Popular local restaurants and cafes currently open
                3. ALERTS: Any weather, traffic, or safety alerts for the area
                
                For each item:
                - Generate a unique ID (like "event_001", "restaurant_001", "alert_001")
                - Include specific addresses and approximate coordinates if possible
                - Include official website URLs when available
                - Provide citation information ONLY if it's from a different source than the official website
                - For every category, try to include at least 5 items
                
                Return as JSON with events, restaurants, and alerts arrays.
                
                IMPORTANT: For each item, include:
                - id: unique identifier
                - website: official website URL if available (leave empty if not available)
                - citation: object with url, title, and description ONLY if different from official website (leave empty if not available or same as website)
                """
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"schema": schema}
            },
            "return_citations": True,
            "return_images": False
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
    
        # Return both content and citations
        result = {
            "content": response["choices"][0]["message"]["content"],
            "citations": response.get("citations", [])
        }
        
        return result
    
    def search_with_context_size(self,
                                prompt: str,
                                context_size: str = "low",
                                model: str = "sonar-reasoning-pro") -> str:
        """Search with specified context size (low, medium, high)."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "Be precise and concise."},
                {"role": "user", "content": prompt}
            ],
            "web_search_options": {
                "search_context_size": context_size
            }
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]

    def get_location_insights(self, 
                            location_name: str,
                            location_type: str, 
                            description: str,
                            address: str,
                            model: str = "sonar-reasoning") -> str:
        """Get personalized insights and recommendations for a location."""
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": 
                """
                You are an expert local guide and travel advisor. Provide personalized, practical advice for visitors to specific locations.
                
                Your response should be helpful, actionable, and based on real knowledge about the type of place and local customs.
                
                Structure your response as:
                1. **Best Times to Visit** - When to go for optimal experience
                2. **What to Try** - Specific recommendations (food, activities, experiences)
                3. **Pro Tips** - Insider knowledge and best practices
                4. **What to Avoid** - Common mistakes or things to skip
                5. **Budget Considerations** - Price expectations and money-saving tips
                
                Keep advice practical, specific, and engaging. Use emojis to make it visually appealing.
                """
                },
                {"role": "user", "content": f"""
                Please provide personalized recommendations for:
                
                **Location**: {location_name}
                **Type**: {location_type}
                **Description**: {description}
                **Address**: {address}
                
                Give me specific, actionable advice for making the most of a visit to this place.
                """}
            ],
            "return_citations": True
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload).json()
        return response["choices"][0]["message"]["content"]

    # Example usage
    def example_usage():
        # Initialize the API
        api = PerplexityAPI()
        
        # Basic query
        result = api.basic_query("What is the capital of France?")
        print("Basic Query Result:", result)
        
        # Domain filtered search
        result = api.filtered_search(
            "Tell me about the James Webb Space Telescope discoveries.",
            domain_filters=["nasa.gov", "wikipedia.org", "space.com"]
        )
        print("Domain Filtered Result:", result)
        
        # Date filtered search
        result = api.date_filtered_search(
            "Show me tech news published this week.",
            after_date="5/19/2025",
            before_date="5/24/2025"
        )
        print("Date Filtered Result:", result)
        
        # Location based search
        result = api.location_based_search(
            "What are some good coffee shops nearby?",
            latitude=48.8566,
            longitude=2.3522,
            country="FR"
        )
        print("Location Based Result:", result)
        
        # Image search
        result = api.image_search("Show me images of Mount Everest")
        print("Image Search Result:", result)
        
        # Image analysis
        result = api.analyze_image(
            "Can you describe this image?",
            image_url="https://example.com/image.jpg"
        )
        print("Image Analysis Result:", result)
        
        # Structured output
        # from pydantic import BaseModel
        
        # class PersonInfo(BaseModel):
        #     first_name: str
        #     last_name: str
        #     year_of_birth: int
            
        # schema = PersonInfo.model_json_schema()
        # result = api.structured_output(
        #     "Tell me about Albert Einstein. Format as JSON with first_name, last_name, and year_of_birth.",
        #     schema=schema
        # )
        # print("Structured Output Result:", result)
        
        # Search with context size
        result = api.search_with_context_size(
            "Explain quantum computing in simple terms.",
            context_size="high"
        )
        print("Context Size Search Result:", result)