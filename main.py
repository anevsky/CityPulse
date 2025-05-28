from fasthtml.common import *

import os
from dotenv import load_dotenv

from datetime import datetime
import uuid

from perplexity_client import PerplexityAPI

# Load environment variables
load_dotenv()

# Create the FastHTML app
app, rt = fast_app(
    pico=False,
    hdrs=(
        Link(rel="icon", href="/static/favicon.ico", type="image/x-icon"),
    )
)

# In-memory storage for shared locations
SHARED_LOCATIONS = {}

LOCAL_INFO_SCHEMA = {
    "type": "object",
    "properties": {
        "events": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "type": {"type": "string"},
                    "address": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "description": {"type": "string"},
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "website": {"type": "string"},
                    "citation": {
                        "type": "object",
                        "properties": {
                            "url": {"type": "string"},
                            "title": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    }
                },
                "required": ["id", "name", "type", "description"]
            }
        },
        "restaurants": {
            "type": "array", 
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "address": {"type": "string"},
                    "cuisine": {"type": "string"},
                    "description": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "website": {"type": "string"},
                    "citation": {
                        "type": "object",
                        "properties": {
                            "url": {"type": "string"},
                            "title": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    }
                },
                "required": ["id", "name", "description"]
            }
        },
        "alerts": {
            "type": "array",
            "items": {
                "type": "object", 
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "severity": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "latitude": {"type": "number"},
                    "longitude": {"type": "number"},
                    "website": {"type": "string"},
                    "citation": {
                        "type": "object",
                        "properties": {
                            "url": {"type": "string"},
                            "title": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    }
                },
                "required": ["id", "title", "description"]
            }
        }
    },
    "required": ["events", "restaurants", "alerts"]
}

# For images, CSS, etc.
@app.get("/{fname:path}.{ext:static}")
def static(fname: str, ext: str):
    return FileResponse(f'{fname}.{ext}')

@rt("/")
def get():
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    return Titled("🏙️ CityPulse - AI-powered Geospatial Search",
        Div(
            Div(
                # Search and Discover section
                Div(
                    Div(
                        Div(
                            Input(
                                type="text", 
                                placeholder="What are you looking for right now? (e.g., 'coffee shops', 'live music', 'parking')",
                                cls="form-control",
                                id="search-input",
                                autocomplete="off"
                            ),
                            Div(id="search-suggestions", cls="dropdown-menu", style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000;"),
                            cls="form-control"
                        ),
                        Button(
                            Span(I(cls="bi bi-search me-1"), Span("Search", cls="btn-text")),
                            cls="btn btn-primary", 
                            id="search-btn", 
                            onclick="performSearch()"
                        ),
                        Button(
                            Span("🌟 ", Span("Discover Nearby", cls="btn-text")), 
                            cls="btn btn-success", 
                            id="discover-btn", 
                            onclick="discoverNearby()", 
                            style="display: none;"
                        ),
                        cls="input-group mb-3"
                    ),
                    cls="row mb-3"
                ),
                
                # Welcome message
                Div(
                    Div(id="welcome-message", cls="alert alert-info text-center", style="display: none;"),
                    cls="row mb-3"
                ),
                
                # Map with padding
                Div(
                    Div(
                        Div(id="map", style="height: 500px; width: 100%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"),
                        cls="p-3 bg-light rounded"
                    ),
                    cls="row"
                ),
                
                # Quick Action Cards
                Div(
                    Div(
                        H4("Quick Explore", cls="text-center mb-4"),
                        Div(
                            # What to Do card
                            Div(
                                Div(
                                    Div(
                                        I(cls="bi bi-calendar-event", style="font-size: 2rem; color: #e74c3c;"),
                                        cls="text-center mb-3"
                                    ),
                                    H5("What to Do", cls="card-title text-center"),
                                    P("Discover events, activities, and entertainment happening right now", cls="card-text text-center text-muted"),
                                    Button("Explore Activities", cls="btn btn-outline-danger w-100", onclick="quickSearch('activities and events')"),
                                    cls="card-body"
                                ),
                                cls="card h-100 quick-action-card"
                            ),
                            cls="col-md-4 mb-3"
                        ),
                        
                        Div(
                            # What to See card
                            Div(
                                Div(
                                    Div(
                                        I(cls="bi bi-camera", style="font-size: 2rem; color: #3498db;"),
                                        cls="text-center mb-3"
                                    ),
                                    H5("What to See", cls="card-title text-center"),
                                    P("Find attractions, landmarks, and must-see spots in your area", cls="card-text text-center text-muted"),
                                    Button("Find Attractions", cls="btn btn-outline-primary w-100", onclick="quickSearch('tourist attractions and landmarks')"),
                                    cls="card-body"
                                ),
                                cls="card h-100 quick-action-card"
                            ),
                            cls="col-md-4 mb-3"
                        ),
                        
                        Div(
                            # What to Eat card
                            Div(
                                Div(
                                    Div(
                                        I(cls="bi bi-cup-hot", style="font-size: 2rem; color: #f39c12;"),
                                        cls="text-center mb-3"
                                    ),
                                    H5("What to Eat", cls="card-title text-center"),
                                    P("Discover restaurants, cafes, and local food specialties", cls="card-text text-center text-muted"),
                                    Button("Find Food", cls="btn btn-outline-warning w-100", onclick="quickSearch('restaurants and food')"),
                                    cls="card-body"
                                ),
                                cls="card h-100 quick-action-card"
                            ),
                            cls="col-md-4 mb-3"
                        ),
                        
                        Div(
                            # What to Buy card
                            Div(
                                Div(
                                    Div(
                                        I(cls="bi bi-bag-check", style="font-size: 2rem; color: #9b59b6;"),
                                        cls="text-center mb-3"
                                    ),
                                    H5("What to Buy", cls="card-title text-center"),
                                    P("Explore shopping areas, markets, and local stores", cls="card-text text-center text-muted"),
                                    Button("Go Shopping", cls="btn btn-outline-purple w-100", onclick="quickSearch('shopping and markets')"),
                                    cls="card-body"
                                ),
                                cls="card h-100 quick-action-card"
                            ),
                            cls="col-md-6 mb-3"
                        ),
                        
                        Div(
                            # What's Happening card
                            Div(
                                Div(
                                    Div(
                                        I(cls="bi bi-newspaper", style="font-size: 2rem; color: #27ae60;"),
                                        cls="text-center mb-3"
                                    ),
                                    H5("What's Happening", cls="card-title text-center"),
                                    P("Stay updated with local news, events, and current happenings", cls="card-text text-center text-muted"),
                                    Button("Latest News", cls="btn btn-outline-success w-100", onclick="quickSearch('local news and current events')"),
                                    cls="card-body"
                                ),
                                cls="card h-100 quick-action-card"
                            ),
                            cls="col-md-6 mb-3"
                        ),
                        
                        cls="row"
                    ),
                    cls="row mt-4",
                    id="quick-actions",
                    style="display: none;"
                ),
                
                cls="container"
            ),
            
            # Progress overlay
            Div(
                Div(
                    Div(cls="spinner-border spinner-border-custom text-primary"),
                    H5("Loading...", id="progress-text", cls="mt-3"),
                    P("Please wait while we fetch the latest information.", cls="text-muted"),
                    cls="progress-content"
                ),
                cls="progress-overlay",
                id="progress-overlay",
                style="display: none;"
            ),
            
            # Modal HTML 
            Div(
                Div(
                    Div(
                        Div(
                            H5("", id="modal-title", cls="modal-title"),
                            Button("", type="button", cls="btn-close", **{"data-bs-dismiss": "modal"}),
                            cls="modal-header"
                        ),
                        Div("", id="modal-body", cls="modal-body"),
                        Div(
                            Div("", id="modal-insights", cls="modal-insights", style="display: none;"),
                            cls="modal-body border-top"
                        ),
                        Div(
                            Button("❌ Close", type="button", cls="btn btn-secondary", **{"data-bs-dismiss": "modal"}),
                            Button("💡 Get Insights", type="button", cls="btn btn-info", id="insights-btn", onclick="getLocationInsights()"),
                            Button("📸 Share", type="button", cls="btn btn-success", id="share-btn", onclick="shareLocation()"),
                            Button("🗺 Get Directions", type="button", cls="btn btn-primary", id="directions-btn", onclick="getDirections()"),
                            cls="modal-footer"
                        ),
                        cls="modal-content"
                    ),
                    cls="modal-dialog modal-lg"
                ),
                cls="modal fade",
                id="info-modal",
                tabindex="-1"
            )
        ),
        
        # Include CSS files
        Link(rel="stylesheet", href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"),
        Link(rel="stylesheet", href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"),
        Link(rel="stylesheet", href="/static/style.css"),
        
        Script(src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"),
        Script(src="/static/app.js"),
        Script(src=f"https://maps.googleapis.com/maps/api/js?key={api_key}&callback=initMap&loading=async&libraries=marker")
    )


@rt("/shared/{location_id}")
def shared_location(location_id: str):
    # This will display a shared location
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    return Titled("🏙️ CityPulse - Shared Location to Explore",
        Div(
            Div(
                Div(id="shared-info", cls="alert alert-info mb-3"),
                Div(id="map", style="height: 500px; width: 100%;"),
                cls="container"
            ),
            
            # Modal HTML
            Div(
                Div(
                    Div(
                        Div(
                            H5("", id="modal-title", cls="modal-title"),
                            Button("×", type="button", cls="btn-close", **{"data-bs-dismiss": "modal"}),
                            cls="modal-header"
                        ),
                        Div("", id="modal-body", cls="modal-body"),
                        Div(
                            Button("Close", type="button", cls="btn btn-secondary", **{"data-bs-dismiss": "modal"}),
                            Button("Share", type="button", cls="btn btn-outline-primary", id="share-btn", onclick="shareLocation()"),
                            Button("Get Directions", type="button", cls="btn btn-primary", id="directions-btn", onclick="getDirections()"),
                            cls="modal-footer"
                        ),
                        cls="modal-content"
                    ),
                    cls="modal-dialog modal-lg"
                ),
                cls="modal fade",
                id="info-modal",
                tabindex="-1"
            )
        ),
        
        # Include Bootstrap CSS and JS
        Link(rel="stylesheet", href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"),
        Script(src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"),
        Script(f"window.sharedLocationId = '{location_id}';"),
        Script(src="/static/app.js"),
        Script(src=f"https://maps.googleapis.com/maps/api/js?key={api_key}&callback=initSharedMap&loading=async&libraries=marker")
    )

@rt("/api/local-data")
def get_local_data(lat: float, lng: float):
    api = PerplexityAPI()
    
    prompt = f"Find current information near coordinates {lat}, {lng}"
    
    max_retries = 10
    for attempt in range(max_retries):
        try:
            result = api.geo_structured_output_with_citations(
                prompt=prompt,
                schema=LOCAL_INFO_SCHEMA
            )
            
            import json
            content = result["content"]
            if isinstance(content, str):
                content = json.loads(content)
            
            # Check if we got meaningful data
            has_data = (
                len(content.get("events", [])) > 0 or 
                len(content.get("restaurants", [])) > 0 or 
                len(content.get("alerts", [])) > 0
            )
            
            if has_data or attempt == max_retries - 1:
                return {
                    "success": True, 
                    "data": content, 
                    "citations": result.get("citations", []),
                    "attempt": attempt + 1
                }
            else:
                print(f"Attempt {attempt + 1}: Got empty arrays, retrying...")
                
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                return {"success": False, "error": str(e)}

@rt("/api/local-data/debug")
def debug_data(lat: float = 30.59077127702062, lng: float = -97.8626356236235):
    api = PerplexityAPI()
    
    prompt = f"Find current information near coordinates {lat}, {lng}"
    
    max_retries = 10
    for attempt in range(max_retries):
        try:
            result = api.geo_structured_output_with_citations(
                prompt=prompt,
                schema=LOCAL_INFO_SCHEMA
            )
            
            import json
            if isinstance(result, str):
                result = json.loads(result)
            
            # Check if we got meaningful data
            has_data = (
                len(result.get("events", [])) > 0 or 
                len(result.get("restaurants", [])) > 0 or 
                len(result.get("alerts", [])) > 0
            )
            
            if has_data or attempt == max_retries - 1:
                return Div(
                    H2(f"Debug: Structured Response (Attempt {attempt + 1})"),
                    Pre(json.dumps(result, indent=2)),
                    style="padding: 20px; font-family: monospace;"
                )
            else:
                print(f"Attempt {attempt + 1}: Got empty arrays, retrying...")
                
        except Exception as e:
            if attempt == max_retries - 1:
                return Div(
                    H2("Error occurred:"),
                    P(str(e)),
                    style="padding: 20px;"
                )

@rt("/api/local-data-md")
def get_local_data_md(lat: float, lng: float):
    # This will call Perplexity API for local info
    api = PerplexityAPI()
    
    # We'll query for different types of local content
    prompt = f"Find current local events, popular restaurants, and any alerts or news happening near coordinates {lat}, {lng}. Include specific names, addresses, and current status."
    
    result = api.location_based_search(
        prompt=prompt,
        latitude=lat,
        longitude=lng,
        country="US"  # You might want to make this dynamic
    )
    
    return {"data": result}

@rt("/api/share-location", methods=["POST"])
def create_shared_location(data: dict):
    global SHARED_LOCATIONS
    
    # Generate unique ID for this shared location
    location_id = str(uuid.uuid4())[:8]
    
    # Store the location data in memory with proper type conversion
    shared_data = {
        "id": location_id,
        "name": data.get("name"),
        "type": data.get("type"),
        "description": data.get("description"),
        "address": data.get("address"),
        "latitude": float(data.get("latitude")) if data.get("latitude") else None,
        "longitude": float(data.get("longitude")) if data.get("longitude") else None,
        "time": data.get("time"),
        "cuisine": data.get("cuisine"),
        "severity": data.get("severity"),
        "shared_at": str(datetime.now())
    }
    
    # Save to in-memory storage
    SHARED_LOCATIONS[location_id] = shared_data
    
    return {"success": True, "location_id": location_id, "share_url": f"/shared/{location_id}"}

@rt("/api/get-shared-location/{location_id}")
def get_shared_location(location_id: str):
    global SHARED_LOCATIONS
    
    if location_id in SHARED_LOCATIONS:
        return {"success": True, "data": SHARED_LOCATIONS[location_id]}
    else:
        return {"success": False, "error": "Shared location not found"}

# Optional: Add a route to see all shared locations (for debugging)
@rt("/api/shared-locations")
def list_shared_locations():
    global SHARED_LOCATIONS
    return {"shared_locations": list(SHARED_LOCATIONS.keys()), "count": len(SHARED_LOCATIONS)}

@rt("/api/search-local")
def search_local_data(lat: float, lng: float, query: str):
    api = PerplexityAPI()
    
    # Create a custom prompt based on user query
    prompt = f"""Find information about "{query}" near coordinates {lat}, {lng}. 
    
    Based on the query, categorize results appropriately:
    - If it's about events/entertainment/activities, put in events array
    - If it's about food/dining/restaurants, put in restaurants array  
    - If it's about alerts/traffic/weather/safety, put in alerts array
    
    Include relevant results for the user's specific request: "{query}"
    """
    
    max_retries = 10
    for attempt in range(max_retries):
        try:
            result = api.geo_structured_output_with_citations(
                prompt=prompt,
                schema=LOCAL_INFO_SCHEMA
            )
            
            import json
            content = result["content"]
            if isinstance(content, str):
                content = json.loads(content)
            
            # Check if we got meaningful data
            has_data = (
                len(content.get("events", [])) > 0 or 
                len(content.get("restaurants", [])) > 0 or 
                len(content.get("alerts", [])) > 0
            )
            
            if has_data or attempt == max_retries - 1:
                return {
                    "success": True, 
                    "data": content, 
                    "citations": result.get("citations", []),
                    "query": query,
                    "attempt": attempt + 1
                }
            else:
                print(f"Search attempt {attempt + 1}: Got empty arrays, retrying...")
                
        except Exception as e:
            print(f"Search attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                return {"success": False, "error": str(e)}

@rt("/api/search-suggestions")
def get_search_suggestions(query: str, lat: float, lng: float):
    api = PerplexityAPI()
    
    # Create a prompt for search suggestions
    prompt = f"""Based on the partial search query "{query}" and location coordinates {lat}, {lng}, suggest 5 relevant local search terms that users might be looking for.

    Focus on:
    - Local businesses and services
    - Events and activities
    - Popular local attractions
    - Common local needs

    Return suggestions as a simple JSON array of strings, like:
    ["coffee shops near me", "live music tonight", "parking downtown", "best restaurants", "happy hour specials"]
    
    Make suggestions specific and actionable for someone exploring this location."""
    
    try:
        # Use basic query for faster response
        result = api.basic_query(prompt)
        
        # Try to parse as JSON, fallback to simple parsing
        import json
        try:
            suggestions = json.loads(result)
            if isinstance(suggestions, list):
                return {"success": True, "suggestions": suggestions[:5]}
        except:
            # Fallback: extract suggestions from text
            lines = result.split('\n')
            suggestions = []
            for line in lines:
                if '"' in line and len(suggestions) < 5:
                    # Extract text between quotes
                    start = line.find('"')
                    end = line.find('"', start + 1)
                    if start != -1 and end != -1:
                        suggestions.append(line[start+1:end])
            
            return {"success": True, "suggestions": suggestions}
        
        return {"success": False, "suggestions": []}
        
    except Exception as e:
        print(f"Error getting search suggestions: {e}")
        return {"success": False, "suggestions": []}

@rt("/api/location-insights")
def get_location_insights(name: str, type: str, description: str, address: str = ""):
    api = PerplexityAPI()
    
    try:
        insights = api.get_location_insights(
            location_name=name,
            location_type=type,
            description=description,
            address=address
        )
        
        return {"success": True, "insights": insights}
        
    except Exception as e:
        print(f"Error getting location insights: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    serve()