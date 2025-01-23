// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register("{{ url_for('static', filename='sw.js') }}")
      .then(reg => console.log("Service Worker Registered", reg))
      .catch(err => console.error("Service Worker Registration Failed", err));
}

let deferredPrompt;
const installBtn = document.querySelector('.add-button') || document.getElementById('install-app');

if (installBtn) {
  installBtn.style.display = 'none';

  window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.style.display = 'block';

      installBtn.addEventListener('click', () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                  console.log('User installed the app');
              } else {
                  console.log('User dismissed the A2HS prompt');
              }
              deferredPrompt = null;
              installBtn.style.display = 'none';
          });
      });
  });
}

// Monitor online status
window.addEventListener('online', function() {
  console.log("You are online");
});

// Leaflet Map Setup
const map = L.map('map').setView([6.0383, 80.2198], 10); // Center on Galle district
let currentLocationMarker = null;
let routingControl = null;
let userLocation = null;

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

const markers = L.markerClusterGroup();
map.addLayer(markers);

let customers = [];

// Fetch customer data
fetch('/api/customers')
  .then(response => response.json())
  .then(data => {
      customers = data;
      customers.forEach(customer => {
          const marker = L.marker([customer.latitude, customer.longitude])
              .bindPopup(`<b> ${customer.id}, ${customer.name}</b><br>  Tel: ${customer.contact}`);
          markers.addLayer(marker);
      });
  })
  .catch(err => console.error('Error fetching customer data:', err));

// Track real-time location
function updateCurrentLocation() {
  if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
  }

  navigator.geolocation.watchPosition(position => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      if (currentLocationMarker) {
          currentLocationMarker.setLatLng(userLocation);
      } else {
          currentLocationMarker = L.marker(userLocation, { title: 'Your Location' })
              .addTo(map)
              .bindPopup('Your current location');
      }
  }, err => {
      console.error('Error fetching geolocation:', err);
  });
}

// Re-center map
document.getElementById('recenter')?.addEventListener('click', () => {
  if (currentLocationMarker) {
      map.setView(currentLocationMarker.getLatLng(), 15);
  } else {
      alert('Current location not available yet.');
  }
});

// Set route
document.getElementById('set-route')?.addEventListener('click', () => {
  const input = document.getElementById('customer-ids').value.trim();

  if (!input) {
      alert('Please enter at least one customer ID.');
      return;
  }

  const ids = input.split(',').map(id => {
      id = id.trim();
      return id ? parseInt(id, 10) : NaN;
  }).filter(id => !isNaN(id));

  if (ids.length === 0) {
      alert('Customer IDs must be valid numbers.');
      return;
  }

  const selectedCustomers = ids.map(id => customers.find(customer => customer.id === id)).filter(Boolean);

  if (!userLocation) {
      alert('User location not available yet. Please wait and try again.');
      return;
  }

  if (routingControl) {
      map.removeControl(routingControl);
  }

  const waypoints = [
      userLocation,
      ...selectedCustomers.map(customer => L.latLng(customer.latitude, customer.longitude))
  ];

  routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: true,
      showAlternatives: false
  }).addTo(map);

  routingControl.on('routesfound', e => {
      const route = e.routes[0];
      document.getElementById('distance').innerText = `Distance: ${(route.summary.totalDistance / 1000).toFixed(2)} km`;
      document.getElementById('duration').innerText = `Duration: ${(route.summary.totalTime / 60).toFixed(2)} mins`;
  });
});

// Navigation button click
document.getElementById('navigate')?.addEventListener('click', () => {
  if (!routingControl) {
      alert('Set a route first!');
  } else {
      alert('Navigation started!');
  }
});

updateCurrentLocation();
