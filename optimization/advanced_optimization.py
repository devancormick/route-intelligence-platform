"""
Advanced Route Optimization Algorithms
Includes genetic algorithm, simulated annealing, and multi-objective optimization
"""
from typing import List, Tuple, Dict
import numpy as np
import random
from dataclasses import dataclass
from geopy.distance import geodesic
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


@dataclass
class Waypoint:
    latitude: float
    longitude: float
    address: str = ""
    service_type: str = ""
    estimated_duration_minutes: int = 0
    priority: int = 0
    time_window_start: int = None
    time_window_end: int = None


class GeneticAlgorithmOptimizer:
    """Genetic Algorithm for route optimization"""
    
    def __init__(
        self,
        population_size: int = 100,
        generations: int = 200,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8,
    ):
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate

    def calculate_distance_matrix(self, waypoints: List[Waypoint]) -> np.ndarray:
        """Calculate distance matrix"""
        n = len(waypoints)
        matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    point1 = (waypoints[i].latitude, waypoints[i].longitude)
                    point2 = (waypoints[j].latitude, waypoints[j].longitude)
                    matrix[i][j] = geodesic(point1, point2).kilometers
        
        return matrix

    def calculate_fitness(self, route: List[int], distance_matrix: np.ndarray) -> float:
        """Calculate route fitness (inverse of total distance)"""
        total_distance = 0
        for i in range(len(route) - 1):
            total_distance += distance_matrix[route[i]][route[i + 1]]
        return 1.0 / (total_distance + 1e-10)

    def create_individual(self, n: int) -> List[int]:
        """Create a random individual (route)"""
        route = list(range(1, n))
        random.shuffle(route)
        return [0] + route  # Start at first waypoint

    def crossover(self, parent1: List[int], parent2: List[int]) -> Tuple[List[int], List[int]]:
        """Order crossover (OX)"""
        n = len(parent1)
        start, end = sorted(random.sample(range(1, n - 1), 2))
        
        child1 = parent1[start:end]
        child2 = parent2[start:end]
        
        for item in parent2:
            if item not in child1:
                child1.append(item)
        
        for item in parent1:
            if item not in child2:
                child2.append(item)
        
        return child1, child2

    def mutate(self, route: List[int]) -> List[int]:
        """Swap mutation"""
        if random.random() < self.mutation_rate:
            i, j = random.sample(range(1, len(route)), 2)
            route[i], route[j] = route[j], route[i]
        return route

    def optimize(self, waypoints: List[Waypoint]) -> List[int]:
        """Run genetic algorithm optimization"""
        if len(waypoints) < 2:
            return list(range(len(waypoints)))

        n = len(waypoints)
        distance_matrix = self.calculate_distance_matrix(waypoints)

        # Initialize population
        population = [self.create_individual(n) for _ in range(self.population_size)]

        for generation in range(self.generations):
            # Calculate fitness
            fitness = [self.calculate_fitness(route, distance_matrix) for route in population]
            
            # Selection (tournament selection)
            new_population = []
            for _ in range(self.population_size):
                tournament = random.sample(list(zip(population, fitness)), 3)
                winner = max(tournament, key=lambda x: x[1])[0]
                new_population.append(winner.copy())

            # Crossover
            for i in range(0, len(new_population) - 1, 2):
                if random.random() < self.crossover_rate:
                    child1, child2 = self.crossover(new_population[i], new_population[i + 1])
                    new_population[i] = child1
                    new_population[i + 1] = child2

            # Mutation
            for i in range(len(new_population)):
                new_population[i] = self.mutate(new_population[i])

            population = new_population

        # Return best route
        fitness = [self.calculate_fitness(route, distance_matrix) for route in population]
        best_route = population[np.argmax(fitness)]
        
        return best_route


class SimulatedAnnealingOptimizer:
    """Simulated Annealing for route optimization"""
    
    def __init__(
        self,
        initial_temperature: float = 1000.0,
        cooling_rate: float = 0.995,
        min_temperature: float = 0.1,
    ):
        self.initial_temperature = initial_temperature
        self.cooling_rate = cooling_rate
        self.min_temperature = min_temperature

    def calculate_distance(self, route: List[int], waypoints: List[Waypoint]) -> float:
        """Calculate total route distance"""
        total = 0
        for i in range(len(route) - 1):
            point1 = (waypoints[route[i]].latitude, waypoints[route[i]].longitude)
            point2 = (waypoints[route[i + 1]].latitude, waypoints[route[i + 1]].longitude)
            total += geodesic(point1, point2).kilometers
        return total

    def generate_neighbor(self, route: List[int]) -> List[int]:
        """Generate neighbor by swapping two random waypoints"""
        neighbor = route.copy()
        i, j = random.sample(range(1, len(neighbor)), 2)
        neighbor[i], neighbor[j] = neighbor[j], neighbor[i]
        return neighbor

    def optimize(self, waypoints: List[Waypoint]) -> List[int]:
        """Run simulated annealing optimization"""
        if len(waypoints) < 2:
            return list(range(len(waypoints)))

        # Initial solution (nearest neighbor)
        current_route = [0]
        unvisited = set(range(1, len(waypoints)))
        current = 0

        while unvisited:
            nearest = min(
                unvisited,
                key=lambda x: geodesic(
                    (waypoints[current].latitude, waypoints[current].longitude),
                    (waypoints[x].latitude, waypoints[x].longitude)
                ).kilometers
            )
            current_route.append(nearest)
            unvisited.remove(nearest)
            current = nearest

        current_distance = self.calculate_distance(current_route, waypoints)
        best_route = current_route.copy()
        best_distance = current_distance

        temperature = self.initial_temperature

        while temperature > self.min_temperature:
            neighbor = self.generate_neighbor(current_route)
            neighbor_distance = self.calculate_distance(neighbor, waypoints)

            if neighbor_distance < current_distance:
                current_route = neighbor
                current_distance = neighbor_distance
                if neighbor_distance < best_distance:
                    best_route = neighbor.copy()
                    best_distance = neighbor_distance
            else:
                # Accept worse solution with probability
                probability = np.exp(-(neighbor_distance - current_distance) / temperature)
                if random.random() < probability:
                    current_route = neighbor
                    current_distance = neighbor_distance

            temperature *= self.cooling_rate

        return best_route


class MultiObjectiveOptimizer:
    """Multi-objective optimization considering distance, time, and priority"""
    
    def optimize(
        self,
        waypoints: List[Waypoint],
        weights: Dict[str, float] = None,
    ) -> List[int]:
        """Optimize considering multiple objectives"""
        if weights is None:
            weights = {'distance': 0.5, 'time': 0.3, 'priority': 0.2}

        # Use OR-Tools with custom cost function
        n = len(waypoints)
        manager = pywrapcp.RoutingIndexManager(n, 1, 0)
        routing = pywrapcp.RoutingModel(manager)

        def cost_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            
            point1 = (waypoints[from_node].latitude, waypoints[from_node].longitude)
            point2 = (waypoints[to_node].latitude, waypoints[to_node].longitude)
            distance = geodesic(point1, point2).kilometers
            
            time_cost = waypoints[to_node].estimated_duration_minutes or 30
            priority_cost = 10 - waypoints[to_node].priority  # Higher priority = lower cost
            
            return int(
                distance * weights['distance'] * 1000 +
                time_cost * weights['time'] * 10 +
                priority_cost * weights['priority'] * 100
            )

        transit_callback_index = routing.RegisterTransitCallback(cost_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )

        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            index = routing.Start(0)
            route = []
            while not routing.IsEnd(index):
                route.append(manager.IndexToNode(index))
                index = solution.Value(routing.NextVar(index))
            return route

        # Fallback
        return list(range(n))
