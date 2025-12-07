import { useQuery, useMutation, gql } from '@apollo/client';
import { useState } from 'react';

const GET_PANEL_TYPES = gql`
  query GetPanelTypes {
    panelTypes {
      id
      name
      manufacturer
      efficiency
      wattage
      pricePerWatt
    }
  }
`;

const GET_LOCATIONS = gql`
  query GetLocations {
    locations {
      id
      city
      country
      avgSunHoursPerDay
    }
  }
`;

const GET_SIMULATIONS = gql`
  query GetSimulations {
    simulations {
      id
      roofSizeM2
      estimatedOutput
      estimatedCost
      estimatedROI
      createdAt
      location {
        city
        country
      }
      panelType {
        name
        manufacturer
      }
    }
  }
`;

const CREATE_SIMULATION = gql`
  mutation CreateSimulation($input: CreateSimulationInput!) {
    createSimulation(input: $input) {
      id
      estimatedOutput
      estimatedCost
      estimatedROI
    }
  }
`;

interface PanelType {
  id: string;
  name: string;
  manufacturer: string;
  efficiency: number;
  wattage: number;
  pricePerWatt: number;
}

interface Location {
  id: string;
  city: string;
  country: string;
  avgSunHoursPerDay: number;
}

interface Simulation {
  id: string;
  location: Location;
  panelType: { name: string; manufacturer: string };
  roofSizeM2: number;
  estimatedOutput: number;
  estimatedCost: number;
  estimatedROI: number;
  createdAt: string;
}

function App() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedPanel, setSelectedPanel] = useState('');
  const [roofSize, setRoofSize] = useState('');

  const { data: panelsData } = useQuery(GET_PANEL_TYPES);
  const { data: locationsData } = useQuery(GET_LOCATIONS);
  const { data: simulationsData } = useQuery(GET_SIMULATIONS);

  const [createSimulation, { loading, data: mutationData }] = useMutation(
    CREATE_SIMULATION,
    {
      refetchQueries: [{ query: GET_SIMULATIONS }],
    }
  );

  const panels = panelsData?.panelTypes || [];
  const locations = locationsData?.locations || [];
  const simulations = simulationsData?.simulations || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation && selectedPanel && roofSize) {
      createSimulation({
        variables: {
          input: {
            locationId: selectedLocation,
            panelTypeId: selectedPanel,
            roofSizeM2: parseFloat(roofSize),
          },
        },
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">☀️ Renewable Energy Planner</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Plan Your System</h2>

        {/* Location */}
        <div className="mb-4">
          <label className="block mb-1">Location</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select a location</option>
            {locations.map((loc: Location) => (
              <option key={loc.id} value={loc.id}>
                {loc.city}, {loc.country} ({loc.avgSunHoursPerDay}h sun/day)
              </option>
            ))}
          </select>
        </div>

        {/* Panel Type */}
        <div className="mb-4">
          <label className="block mb-1">Solar Panel Type</label>
          <select
            value={selectedPanel}
            onChange={(e) => setSelectedPanel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select a panel</option>
            {panels.map((panel: PanelType) => (
              <option key={panel.id} value={panel.id}>
                {panel.name} - {panel.efficiency}% ({panel.wattage}W)
              </option>
            ))}
          </select>
        </div>

        {/* Selected panel info */}
        {selectedPanel && (
          <div className="mb-4 p-2 bg-gray-100 rounded">
            Selected Panel:{' '}
            {panels.find((p: PanelType) => p.id === selectedPanel)?.manufacturer} - $
            {panels.find((p: PanelType) => p.id === selectedPanel)?.pricePerWatt}/W
          </div>
        )}

        {/* Roof Size */}
        <div className="mb-4">
          <label className="block mb-1">Roof Size (m²)</label>
          <input
            type="number"
            value={roofSize}
            onChange={(e) => setRoofSize(e.target.value)}
            placeholder="e.g., 50"
            min="1"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {loading ? 'Calculating...' : 'Calculate Energy Output'}
        </button>
      </form>

      {/* Simulation Results */}
      {mutationData && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg mb-8">
          <h3 className="font-bold mb-2">Simulation Complete!</h3>
          <p>
            Annual Output:{' '}
            {mutationData.createSimulation.estimatedOutput.toFixed(0)} kWh
          </p>
          <p>
            Estimated Cost: $
            {mutationData.createSimulation.estimatedCost.toFixed(0)}
          </p>
          <p>
            ROI: {mutationData.createSimulation.estimatedROI.toFixed(1)} years
          </p>
        </div>
      )}

      {/* Past Simulations */}
      <div>
        <h2 className="text-xl font-bold mb-4">Past Simulations</h2>

        {simulations.length === 0 && (
          <p>No simulations yet. Create your first one!</p>
        )}

        {simulations.map((sim: Simulation) => (
          <div
            key={sim.id}
            className="p-4 border border-gray-300 rounded-lg mb-4"
          >
            <div className="font-semibold">
              {sim.location.city}, {sim.location.country}
            </div>

            <div>{sim.panelType.manufacturer} - {sim.roofSizeM2}m²</div>

            <div className="text-sm text-gray-600 mb-2">
              {new Date(sim.createdAt).toLocaleDateString()}
            </div>

            <div><strong>Output:</strong> {sim.estimatedOutput.toFixed(0)} kWh</div>
            <div><strong>Cost:</strong> ${sim.estimatedCost.toFixed(0)}</div>
            <div><strong>ROI:</strong> {sim.estimatedROI.toFixed(1)}y</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
