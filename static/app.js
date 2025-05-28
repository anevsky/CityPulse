// Global variables
window.currentLocation = null;
window.currentMarkers = [];
window.mapInstance = null;
window.fullDataStore = {};

// Marker configurations for different categories
const markerConfig = {
    event: {
        color: '#e74c3c',  // Red
        icon: '♪',
        label: 'Event'
    },
    restaurant: {
        color: '#3498db',  // Blue  
        icon: '🍽',
        label: 'Restaurant'
    },
    alert: {
        color: '#f39c12',  // Orange
        icon: '⚠',
        label: 'Alert'
    },
    user: {
        color: '#2ecc71',  // Green
        icon: '●',
        label: 'You'
    }
};

// Initialize main map
window.initMap = function() {
    const defaultLocation = { lat: 37.8052, lng: -122.4254 };
    
    // Store map globally
    window.mapInstance = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: defaultLocation,
        mapId: "DEMO_MAP_ID"
    });
    
    // Get user location but don't auto-load data
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                
                // Store current location globally
                window.currentLocation = userLocation;
                
                window.mapInstance.setCenter(userLocation);
                
                // Add user marker
                const userMarker = new google.maps.marker.AdvancedMarkerElement({
                    map: window.mapInstance,
                    position: userLocation,
                    content: createMarkerElement('user', true),
                    title: "You are here"
                });
                
                // Show welcome message and quick actions
                showWelcomeMessage();
            },
            () => {
                console.log("Geolocation failed, using default location");
                window.currentLocation = defaultLocation;
                showWelcomeMessage();
            }
        );
    } else {
        window.currentLocation = defaultLocation;
        showWelcomeMessage();
    }
}

// Show welcome message and quick actions
function showWelcomeMessage() {
    const welcomeDiv = document.getElementById('welcome-message');
    const discoverBtn = document.getElementById('discover-btn');
    
    if (welcomeDiv && discoverBtn) {
        welcomeDiv.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-11">
                    <h5 class="mb-2 text-dark">🌆 Welcome to CityPulse!</h5>
                    <p class="mb-0 text-dark">Discover what's happening around you right now. Search for something specific, use the "Discover Nearby" button, or try one of the quick explore options.</p>
                </div>
                <div class="col-md-1 text-center">
                    <i class="bi bi-geo-alt-fill" style="font-size: 2.5rem; color: #198754;"></i>
                </div>
            </div>
        `;
        welcomeDiv.style.display = 'block';
        discoverBtn.style.display = 'block';
        
        // Show quick actions
        showQuickActions();
    }
}

// Discover nearby places
window.discoverNearby = function() {
    if (!window.currentLocation) {
        alert('Location not available. Please allow location access and refresh the page.');
        return;
    }
    
    // Show progress
    showProgress("Discovering nearby places...");
    setButtonLoading('discover-btn', true, "Discovering...");
    
    // Load local data
    loadLocalData(window.currentLocation.lat, window.currentLocation.lng)
        .then(() => {
            hideProgress();
            setButtonLoading('discover-btn', false); // Will restore original text
        })
        .catch(error => {
            console.error('Discovery error:', error);
            hideProgress();
            setButtonLoading('discover-btn', false); // Will restore original text
            alert('Failed to discover nearby places. Please try again.');
        });
}

// Initialize shared location map
window.initSharedMap = function() {
    if (typeof window.sharedLocationId === 'undefined') {
        initMap();
        return;
    }
    
    const defaultLocation = { lat: 37.8052, lng: -122.4254 };
    
    window.mapInstance = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: defaultLocation,
        mapId: "DEMO_MAP_ID"
    });
    
    const infoWindow = new google.maps.InfoWindow();
    
    fetch(`/api/get-shared-location/${window.sharedLocationId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const data = result.data;
                
                document.getElementById('shared-info').innerHTML = `
                    <strong>📍 Shared Location:</strong> ${data.name} 
                    <small class="text-muted">(shared on ${new Date(data.shared_at).toLocaleDateString()})</small>
                `;
                
                const position = data.latitude && data.longitude 
                    ? { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) }
                    : defaultLocation;

                window.mapInstance.setCenter(position);
                window.mapInstance.setZoom(16);
                
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    map: window.mapInstance,
                    position: position,
                    content: createMarkerElement(data.type),
                    title: data.name
                });
                
                const content = `
                    <div style="max-width: 250px;">
                        <h6>${getMarkerIcon(data.type)} ${data.name}</h6>
                        <p class="text-dark" style="margin: 5px 0; font-size: 0.9em;">${data.description}</p>
                        ${data.address ? `<small class="text-dark">📍 ${data.address}</small><br>` : ''}
                        ${data.time ? `<small class="text-dark">⏰ ${data.time}</small><br>` : ''}
                        ${data.cuisine ? `<small class="text-dark">🍽️ ${data.cuisine}</small><br>` : ''}
                        <a href="#" onclick="openDirectionsToShared('${data.address || data.name}')" style="color: #007bff;">Get Directions</a>
                    </div>
                `;
                infoWindow.setContent(content);
                infoWindow.open(window.mapInstance, marker);
                
            } else {
                document.getElementById('shared-info').innerHTML = `
                    <strong>❌ Error:</strong> Shared location not found or has expired.
                `;
            }
        })
        .catch(error => {
            console.error('Error loading shared location:', error);
            document.getElementById('shared-info').innerHTML = `
                <strong>❌ Error:</strong> Failed to load shared location.
            `;
        });
}

// Create custom marker element
function createMarkerElement(type, isUser = false) {
    const config = markerConfig[type];
    if (!config) return document.createElement('div');
    
    const markerElement = document.createElement('div');
    
    if (isUser) {
        markerElement.innerHTML = `
            <div style="
                background-color: ${config.color};
                width: 25px;
                height: 25px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.9;
            ">
                <span style="color: white; font-size: 8px;">${config.icon}</span>
            </div>
        `;
    } else {
        markerElement.innerHTML = `
            <div style="
                background-color: ${config.color};
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                cursor: pointer;
                opacity: 0.85;
            ">
                <span style="
                    transform: rotate(45deg);
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                ">${config.icon}</span>
            </div>
        `;
    }
    
    return markerElement;
}

// Create pins from structured data
function createPinsFromData(data, userLat, userLng) {
    if (!window.mapInstance) {
        console.error("Map not initialized");
        return;
    }
    
    const infoWindow = new google.maps.InfoWindow();
    
    // Create event pins
    if (data.events && Array.isArray(data.events)) {
        data.events.forEach((event, index) => {
            const position = event.latitude && event.longitude 
                ? { lat: parseFloat(event.latitude), lng: parseFloat(event.longitude) }
                : { lat: userLat + (Math.random() - 0.5) * 0.01, lng: userLng + (Math.random() - 0.5) * 0.01 };
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: window.mapInstance,
                position: position,
                content: createMarkerElement('event'),
                title: event.name
            });
            
            window.currentMarkers.push(marker);
            
            marker.addListener("gmp-click", () => {
                const dataId = `event_${Date.now()}_${index}`;
                window.fullDataStore[dataId] = {
                    type: 'event',
                    id: event.id,
                    name: event.name,
                    description: event.description,
                    date: event.date || 'Date not specified',
                    time: event.time || 'Time not specified',
                    address: event.address || 'Address not specified',
                    website: event.website || null,
                    citation: event.citation || null,
                    latitude: position.lat,
                    longitude: position.lng
                };
                
                const content = `
                    <div style="max-width: 250px;">
                        <h6>${markerConfig.event.icon} ${event.name}</h6>
                        <p class="text-dark" style="margin: 5px 0; font-size: 0.9em;">${event.description}</p>
                        <small class="text-dark">📅 ${event.date || 'Date TBD'} • ⏰ ${event.time || 'Time TBD'}</small><br>
                        <small class="text-dark">📍 ${event.address || 'Location TBD'}</small><br>
                        <a href="#" onclick="showFullInfo('${dataId}')" style="color: #007bff;">Learn more</a>
                    </div>
                `;
                infoWindow.setContent(content);
                infoWindow.open(window.mapInstance, marker);
            });
        });
    }
    
    // Create restaurant pins
    if (data.restaurants && Array.isArray(data.restaurants)) {
        data.restaurants.forEach((restaurant, index) => {
            const position = restaurant.latitude && restaurant.longitude 
                ? { lat: parseFloat(restaurant.latitude), lng: parseFloat(restaurant.longitude) }
                : { lat: userLat + (Math.random() - 0.5) * 0.01, lng: userLng + (Math.random() - 0.5) * 0.01 };
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: window.mapInstance,
                position: position,
                content: createMarkerElement('restaurant'),
                title: restaurant.name
            });
            
            window.currentMarkers.push(marker);
            
            marker.addListener("gmp-click", () => {
                const dataId = `restaurant_${Date.now()}_${index}`;
                window.fullDataStore[dataId] = {
                    type: 'restaurant',
                    id: restaurant.id,
                    name: restaurant.name,
                    description: restaurant.description,
                    cuisine: restaurant.cuisine || 'Cuisine not specified',
                    address: restaurant.address || 'Address not specified',
                    date: restaurant.date || 'Open Today',
                    time: restaurant.time || 'Hours TBD',
                    website: restaurant.website || null,
                    citation: restaurant.citation || null,
                    latitude: position.lat,
                    longitude: position.lng
                };
                
                const content = `
                    <div style="max-width: 250px;">
                        <h6>${markerConfig.restaurant.icon} ${restaurant.name}</h6>
                        <p class="text-dark" style="margin: 5px 0; font-size: 0.9em;">${restaurant.description}</p>
                        <small class="text-dark">🍽️ ${restaurant.cuisine || 'Various cuisine'}</small><br>
                        <small class="text-dark">📅 ${restaurant.date || 'Open Today'} • ⏰ ${restaurant.time || 'Hours TBD'}</small><br>
                        <small class="text-dark">📍 ${restaurant.address || 'Address TBD'}</small><br>
                        <a href="#" onclick="showFullInfo('${dataId}')" style="color: #007bff;">Learn more</a>
                    </div>
                `;
                infoWindow.setContent(content);
                infoWindow.open(window.mapInstance, marker);
            });
        });
    }
    
    // Create alert pins
    if (data.alerts && Array.isArray(data.alerts)) {
        data.alerts.forEach((alert, index) => {
            const position = alert.latitude && alert.longitude 
                ? { lat: parseFloat(alert.latitude), lng: parseFloat(alert.longitude) }
                : { lat: userLat + (Math.random() - 0.5) * 0.005, lng: userLng + (Math.random() - 0.5) * 0.005 };
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: window.mapInstance,
                position: position,
                content: createMarkerElement('alert'),
                title: alert.title
            });
            
            window.currentMarkers.push(marker);
            
            marker.addListener("gmp-click", () => {
                const dataId = `alert_${Date.now()}_${index}`;
                window.fullDataStore[dataId] = {
                    type: 'alert',
                    id: alert.id,
                    title: alert.title,
                    description: alert.description,
                    severity: alert.severity || 'Normal',
                    date: alert.date || 'Current',
                    time: alert.time || 'Ongoing',
                    website: alert.website || null,
                    citation: alert.citation || null,
                    latitude: position.lat,
                    longitude: position.lng
                };
                
                const content = `
                    <div style="max-width: 250px;">
                        <h6>${markerConfig.alert.icon} ${alert.title}</h6>
                        <p class="text-dark" style="margin: 5px 0; font-size: 0.9em;">${alert.description}</p>
                        <small class="text-dark">📅 ${alert.date || 'Current'} • ⏰ ${alert.time || 'Ongoing'}</small><br>
                        <small class="text-dark">🚨 Severity: ${alert.severity || 'Normal'}</small><br>
                        <a href="#" onclick="showFullInfo('${dataId}')" style="color: #007bff;">Learn more</a>
                    </div>
                `;
                infoWindow.setContent(content);
                infoWindow.open(window.mapInstance, marker);
            });
        });
    }
}

// Clear existing markers
function clearMarkers() {
    window.currentMarkers.forEach(marker => {
        marker.map = null;
    });
    window.currentMarkers = [];
}

// Auto-zoom map to fit all pins
function fitMapToPins(data, userLat, userLng) {
    if (!window.mapInstance) return;
    
    const bounds = new google.maps.LatLngBounds();
    let hasLocationData = false;
    
    bounds.extend(new google.maps.LatLng(userLat, userLng));
    
    ['events', 'restaurants', 'alerts'].forEach(category => {
        if (data[category] && Array.isArray(data[category])) {
            data[category].forEach(item => {
                if (item.latitude && item.longitude) {
                    bounds.extend(new google.maps.LatLng(parseFloat(item.latitude), parseFloat(item.longitude)));
                    hasLocationData = true;
                }
            });
        }
    });
    
    if (hasLocationData) {
        window.mapInstance.fitBounds(bounds, {top: 50, right: 50, bottom: 50, left: 50});
    } else {
        console.log("No location data available, keeping current zoom level");
    }
}

// Load local data
async function loadLocalData(lat, lng) {
    try {
        const response = await fetch(`/api/local-data?lat=${lat}&lng=${lng}`);
        const result = await response.json();
        
        console.log("Perplexity structured data:", result);
        
        if (result.success && result.data) {
            createPinsFromData(result.data, lat, lng);
            fitMapToPins(result.data, lat, lng);
            
            // Show success message
            const totalResults = (result.data.events?.length || 0) + 
                                (result.data.restaurants?.length || 0) + 
                                (result.data.alerts?.length || 0);
            
            if (totalResults > 0) {
                console.log(`Discovered ${totalResults} nearby places!`);
            }
        } else {
            console.error("Failed to get structured data:", result);
            throw new Error("No data received");
        }
        
    } catch (error) {
        console.error("Error fetching local data:", error);
        throw error;
    }
}

// Search for local data
async function searchLocalData(lat, lng, query) {
    try {
        const response = await fetch(`/api/search-local?lat=${lat}&lng=${lng}&query=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        console.log("Search results:", result);
        
        if (result.success && result.data) {
            createPinsFromData(result.data, lat, lng);
            fitMapToPins(result.data, lat, lng);
            
            const totalResults = (result.data.events?.length || 0) + 
                                (result.data.restaurants?.length || 0) + 
                                (result.data.alerts?.length || 0);
            
            if (totalResults > 0) {
                console.log(`Found ${totalResults} results for "${query}"`);
            } else {
                alert(`No results found for "${query}". Try a different search term.`);
            }
        } else {
            console.error("Failed to get search results:", result);
            alert('Search failed. Please try again.');
        }
        
    } catch (error) {
        console.error("Error performing search:", error);
        throw error;
    }
}

// Perform search
window.performSearch = function() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        alert('Please enter what you\'re looking for!');
        return;
    }
    
    if (!window.currentLocation) {
        alert('Location not available. Please allow location access.');
        return;
    }
    
    // Show progress
    showProgress(`Searching for "${query}"...`);
    setButtonLoading('search-btn', true, "Searching...");
    
    clearMarkers();
    
    searchLocalData(window.currentLocation.lat, window.currentLocation.lng, query)
        .then(() => {
            hideProgress();
            setButtonLoading('search-btn', false); // Will restore original text
        })
        .catch(error => {
            console.error('Search error:', error);
            hideProgress();
            setButtonLoading('search-btn', false); // Will restore original text
            alert('Search failed. Please try again.');
        });
}

// Helper functions for UI
function createAddressLink(address) {
    if (!address || address === 'Address not specified' || address === 'Address TBD') {
        return `<span class="text-muted">${address || 'Address not available'}</span>`;
    }
    
    const encodedAddress = encodeURIComponent(address);
    return `<a href="https://maps.google.com/maps?q=${encodedAddress}" target="_blank" class="text-decoration-none">
        <span class="text-primary">${address}</span> 
        <i class="bi bi-box-arrow-up-right" style="font-size: 0.8em;"></i>
    </a>`;
}

function createSourceLinks(website, citation) {
    let links = [];
    
    // Add official website if available
    if (website && website !== 'Website not available' && website !== '') {
        links.push(`<a href="${website}" target="_blank" class="badge bg-primary text-decoration-none me-1 mb-1">
            🌐 Official Website <i class="bi bi-box-arrow-up-right"></i>
        </a>`);
    }
    
    // Add citation source only if it's different from the website and actually available
    if (citation && citation.url && 
        citation.url !== 'Source not available' && 
        citation.url !== '' &&
        citation.url !== website) {  // Don't duplicate if same as website
        
        const citationTitle = citation.title || 'Source';
        const citationDesc = citation.description || '';
        
        links.push(`<a href="${citation.url}" target="_blank" class="badge bg-info text-decoration-none me-1 mb-1" 
                       title="${citationDesc}">
            📰 ${citationTitle} <i class="bi bi-box-arrow-up-right"></i>
        </a>`);
    }
    
    if (links.length > 0) {
        return `<div class="mt-3">
            <small class="text-muted">📚 Sources:</small><br>
            ${links.join('')}
        </div>`;
    }
    
    return '';
}

function getMarkerIcon(type) {
    const icons = {
        'event': '🎵',
        'restaurant': '🍕', 
        'alert': '⚠️'
    };
    return icons[type] || '📍';
}

// Modal and interaction functions
window.showFullInfo = function(dataId) {
    const fullData = window.fullDataStore[dataId];
    if (!fullData) return;
    
    const modal = new bootstrap.Modal(document.getElementById('info-modal'));
    window.currentModalData = fullData;
    
    // Reset insights section
    const insightsDiv = document.getElementById('modal-insights');
    const insightsBtn = document.getElementById('insights-btn');
    
    if (insightsDiv) {
        insightsDiv.style.display = 'none';
        insightsDiv.innerHTML = '';
    }
    
    if (insightsBtn) {
        insightsBtn.innerHTML = '<i class="bi bi-lightbulb me-1"></i>Get Insights';
        insightsBtn.disabled = false;
    }
    
    if (fullData.type === 'event') {
        document.getElementById('modal-title').textContent = `🎵 ${fullData.name}`;
        document.getElementById('modal-body').innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h6>🎪 Event Details</h6>
                    <div class="mb-3 text-dark">
                        <p class="text-dark"><strong>📝 Description:</strong><br>${fullData.description}</p>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card border-primary">
                                <div class="card-body text-center py-2">
                                    <h6 class="card-title mb-1">📅 Date</h6>
                                    <small class="text-muted">${fullData.date || 'Date TBD'}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-success">
                                <div class="card-body text-center py-2">
                                    <h6 class="card-title mb-1">⏰ Time</h6>
                                    <small class="text-muted">${fullData.time || 'Time TBD'}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mb-2">
                        <p class="text-dark"><strong>📍 Location:</strong><br>${createAddressLink(fullData.address)}</p>
                    </div>
                    ${createSourceLinks(fullData.website, fullData.citation)}
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <div style="font-size: 3rem; margin-bottom: 10px;">🎵</div>
                            <h6 class="card-title">Live Event</h6>
                            <span class="badge bg-primary">🎪 Entertainment</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (fullData.type === 'restaurant') {
        document.getElementById('modal-title').textContent = `🍕 ${fullData.name}`;
        document.getElementById('modal-body').innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h6>🍽️ Restaurant Details</h6>
                    <div class="mb-3 text-dark">
                        <p class="text-dark"><strong>📝 Description:</strong><br>${fullData.description}</p>
                    </div>
                    <div class="mb-3 text-dark">
                        <p class="text-dark"><strong>🍽️ Cuisine:</strong> <span class="badge bg-info">${fullData.cuisine}</span></p>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card border-info">
                                <div class="card-body text-center py-2">
                                    <h6 class="card-title mb-1">📅 Status</h6>
                                    <small class="text-muted">${fullData.date || 'Open Today'}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-warning">
                                <div class="card-body text-center py-2">
                                    <h6 class="card-title mb-1">🕐 Hours</h6>
                                    <small class="text-muted">${fullData.time || 'Hours TBD'}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mb-2">
                        <p class="text-dark"><strong>📍 Address:</strong><br>${createAddressLink(fullData.address)}</p>
                    </div>
                    ${createSourceLinks(fullData.website, fullData.citation)}
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <div style="font-size: 3rem; margin-bottom: 10px;">🍕</div>
                            <h6 class="card-title">Restaurant</h6>
                            <span class="badge bg-success">🍽️ Dining</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (fullData.type === 'alert') {
        document.getElementById('modal-title').textContent = `⚠️ ${fullData.title}`;
        document.getElementById('modal-body').innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h6>🚨 Alert Details</h6>
                    <div class="mb-3 text-dark">
                        <p class="text-dark"><strong>📝 Description:</strong><br>${fullData.description}</p>
                    </div>
                    <div class="mb-3 text-dark">
                        <p class="text-dark"><strong>🚨 Severity:</strong> <span class="badge bg-warning">${fullData.severity}</span></p>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card border-warning">
                                <div class="card-body text-center py-2">
                                    <h6 class="card-title mb-1">📅 Date</h6>
                                    <small class="text-muted">${fullData.date || 'Current'}</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-danger">
                                <div class="card-body text-center py-2">
                                    <h6 class="card-title mb-1">⏰ Time</h6>
                                    <small class="text-muted">${fullData.time || 'Ongoing'}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${fullData.address ? `<div class="mb-2"><p class="text-dark"><strong>📍 Location:</strong><br>${createAddressLink(fullData.address)}</p></div>` : ''}
                    ${createSourceLinks(fullData.website, fullData.citation)}
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <div style="font-size: 3rem; margin-bottom: 10px;">⚠️</div>
                            <h6 class="card-title">Alert</h6>
                            <span class="badge bg-warning">🚨 Important</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    modal.show();
}

window.getDirections = function() {
    const data = window.currentModalData;
    if (!data) return;
    
    const destination = data.address || data.name || data.title;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        window.location.href = `maps://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
        setTimeout(() => {
            window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`, '_blank');
        }, 1000);
    } else if (isAndroid) {
        window.location.href = `google.navigation:q=${encodeURIComponent(destination)}`;
        setTimeout(() => {
            window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`, '_blank');
        }, 1000);
    } else {
        window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`, '_blank');
    }
}

window.shareLocation = function() {
    const data = window.currentModalData;
    if (!data) return;
    
    const shareData = {
        name: data.name || data.title,
        type: data.type,
        description: data.description,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        date: data.date,
        time: data.time,
        cuisine: data.cuisine,
        severity: data.severity,
        website: data.website,
        citation: data.citation
    };
    
    fetch('/api/share-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const shareUrl = window.location.origin + result.share_url;
            
            if (navigator.share) {
                navigator.share({
                    title: `${shareData.name} - Found on CityPulse`,
                    text: `Check out ${shareData.name} I discovered on CityPulse! ${shareData.description}`,
                    url: shareUrl
                });
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert(`🌆 CityPulse - Link copied to clipboard!\n\n${shareUrl}\n\nShare this link to show friends "${shareData.name}" that you discovered!`);
                }).catch(() => {
                    prompt('🌆 CityPulse - Copy this link to share:', shareUrl);
                });
            }
        } else {
            alert('Failed to create shareable link. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error creating share link:', error);
        alert('Failed to create shareable link. Please try again.');
    });
}

window.openDirectionsToShared = function(destination) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        window.location.href = `maps://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
        setTimeout(() => {
            window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`, '_blank');
        }, 1000);
    } else if (isAndroid) {
        window.location.href = `google.navigation:q=${encodeURIComponent(destination)}`;
        setTimeout(() => {
            window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`, '_blank');
        }, 1000);
    } else {
        window.open(`https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`, '_blank');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// Show progress overlay
function showProgress(message = "Loading...") {
    const overlay = document.getElementById('progress-overlay');
    const progressText = document.getElementById('progress-text');
    if (overlay && progressText) {
        progressText.textContent = message;
        overlay.style.display = 'flex';
    }
}

// Hide progress overlay
function hideProgress() {
    const overlay = document.getElementById('progress-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Add button loading state
function setButtonLoading(buttonId, isLoading, loadingText = "Loading...", originalText = null) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        // Store original HTML if not already stored
        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }
        
        button.classList.add('btn-loading');
        button.disabled = true;
        
        // Create loading content
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border btn-spinner';
        spinner.setAttribute('role', 'status');
        
        button.innerHTML = `<span class="btn-text">${loadingText}</span>`;
        button.appendChild(spinner);
        
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        
        // Restore original HTML
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        } else if (originalText) {
            button.innerHTML = originalText;
        }
    }
}

// Search suggestion variables
let suggestionTimeout = null;
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

// Initialize search suggestions
function initSearchSuggestions() {
    const searchInput = document.getElementById('search-input');
    const suggestionsDiv = document.getElementById('search-suggestions');
    
    if (!searchInput || !suggestionsDiv) return;
    
    // Handle input events
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 4) {
            // Debounce the API call
            clearTimeout(suggestionTimeout);
            suggestionTimeout = setTimeout(() => {
                fetchSearchSuggestions(query);
            }, 500);
        } else {
            hideSuggestions();
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        if (!suggestionsDiv.style.display || suggestionsDiv.style.display === 'none') return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
            updateSuggestionSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSuggestionSelection();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (selectedSuggestionIndex >= 0) {
                selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
            } else {
                performSearch();
            }
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            hideSuggestions();
        }
    });
}

// Fetch search suggestions from API
async function fetchSearchSuggestions(query) {
    if (!window.currentLocation) return;
    
    const suggestionsDiv = document.getElementById('search-suggestions');
    if (!suggestionsDiv) return;
    
    // Show loading state
    suggestionsDiv.innerHTML = '<div class="suggestion-loading">Getting suggestions...</div>';
    suggestionsDiv.style.display = 'block';
    
    try {
        const response = await fetch(`/api/search-suggestions?query=${encodeURIComponent(query)}&lat=${window.currentLocation.lat}&lng=${window.currentLocation.lng}`);
        const result = await response.json();
        
        if (result.success && result.suggestions.length > 0) {
            showSuggestions(result.suggestions);
        } else {
            hideSuggestions();
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        hideSuggestions();
    }
}

// Show suggestions
function showSuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('search-suggestions');
    if (!suggestionsDiv) return;
    
    currentSuggestions = suggestions;
    selectedSuggestionIndex = -1;
    
    suggestionsDiv.innerHTML = suggestions.map((suggestion, index) => 
        `<div class="suggestion-item" data-index="${index}" onclick="selectSuggestion('${suggestion.replace(/'/g, "\\'")}')">${suggestion}</div>`
    ).join('');
    
    suggestionsDiv.style.display = 'block';
}

// Hide suggestions
function hideSuggestions() {
    const suggestionsDiv = document.getElementById('search-suggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
        currentSuggestions = [];
        selectedSuggestionIndex = -1;
    }
}

// Update suggestion selection
function updateSuggestionSelection() {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    suggestionItems.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Select a suggestion
function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = suggestion;
        hideSuggestions();
        performSearch();
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && (selectedSuggestionIndex === -1)) {
                performSearch();
            }
        });
    }
    
    // Initialize search suggestions
    initSearchSuggestions();
});

// Get location insights
window.getLocationInsights = function() {
    const data = window.currentModalData;
    if (!data) return;
    
    const insightsDiv = document.getElementById('modal-insights');
    const insightsBtn = document.getElementById('insights-btn');
    
    if (!insightsDiv || !insightsBtn) return;
    
    // Show loading state
    insightsBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Getting Insights...';
    insightsBtn.disabled = true;
    
    insightsDiv.innerHTML = '<div class="insights-loading"><i class="bi bi-hourglass-split me-2"></i>Getting personalized recommendations...</div>';
    insightsDiv.style.display = 'block';
    
    // Prepare request data
    const requestData = {
        name: data.name || data.title,
        type: data.type,
        description: data.description,
        address: data.address || ''
    };
    
    // Fetch insights
    fetch('/api/location-insights?' + new URLSearchParams(requestData))
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showLocationInsights(result.insights);
                insightsBtn.innerHTML = '<i class="bi bi-lightbulb me-1"></i>Refresh Insights';
            } else {
                insightsDiv.innerHTML = '<div class="alert alert-warning">Unable to get insights right now. Please try again later.</div>';
                insightsBtn.innerHTML = '<i class="bi bi-lightbulb me-1"></i>Try Again';
            }
            insightsBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error getting insights:', error);
            insightsDiv.innerHTML = '<div class="alert alert-danger">Failed to get insights. Please try again.</div>';
            insightsBtn.innerHTML = '<i class="bi bi-lightbulb me-1"></i>Try Again';
            insightsBtn.disabled = false;
        });
}

// Show location insights
function showLocationInsights(insights) {
    const insightsDiv = document.getElementById('modal-insights');
    if (!insightsDiv) return;
    
    // Format the insights content
    const formattedInsights = formatInsightsContent(insights);
    
    insightsDiv.innerHTML = `
        <div class="insights-content">
            <h6><i class="bi bi-lightbulb-fill me-2"></i>Personalized Recommendations</h6>
            ${formattedInsights}
        </div>
    `;
}

// Format insights content
function formatInsightsContent(insights) {
    // Convert markdown-style formatting to HTML
    let formatted = insights
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p class="text-dark">')
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags
    formatted = '<p class="text-dark">' + formatted + '</p>';
    
    // Fix empty paragraphs
    formatted = formatted.replace(/<p><\/p>/g, '');
    
    return formatted;
}

// Quick search function
window.quickSearch = function(searchQuery) {
    if (!window.currentLocation) {
        alert('Location not available. Please allow location access.');
        return;
    }
    
    // Set the search input value
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = searchQuery;
    }
    
    // Show progress
    showProgress(`Searching for ${searchQuery}...`);
    
    // Clear existing markers
    clearMarkers();
    
    // Perform search
    searchLocalData(window.currentLocation.lat, window.currentLocation.lng, searchQuery)
        .then(() => {
            hideProgress();
            // Scroll to map to show results
            document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Quick search error:', error);
            hideProgress();
            alert('Search failed. Please try again.');
        });
}

// Show quick actions when location is available
function showQuickActions() {
    const quickActionsDiv = document.getElementById('quick-actions');
    if (quickActionsDiv) {
        quickActionsDiv.style.display = 'block';
    }
}