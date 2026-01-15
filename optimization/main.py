"""
Route Optimization Service
Python FastAPI service for route optimization and gap analysis
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from geopy.distance import geodesic
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
from scipy.spatial.distance import cdist
import uvicorn

app = FastAPI(title="Route Optimization Service")


class Waypoint(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    service_type: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None


class OptimizeRequest(BaseModel):
    waypoints: List[Waypoint]
    algorithm: str = "nearest_neighbor"


class GapAnalysisRequest(BaseModel):
    route_id: str
    operator_id: str


def calculate_distance_matrix(waypoints: List[Waypoint]) -> List[List[int]]:
    """Calculate distance matrix between all waypoints in meters"""
    n = len(waypoints)
    matrix = [[0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(n):
            if i != j:
                point1 = (waypoints[i].latitude, waypoints[i].longitude)
                point2 = (waypoints[j].latitude, waypoints[j].longitude)
                distance_m = geodesic(point1, point2).meters
                matrix[i][j] = int(distance_m)
    
    return matrix


def optimize_nearest_neighbor(waypoints: List[Waypoint]) -> List[int]:
    """Optimize route using nearest neighbor algorithm"""
    if len(waypoints) < 2:
        return list(range(len(waypoints)))
    
    n = len(waypoints)
    distance_matrix = calculate_distance_matrix(waypoints)
    
    unvisited = set(range(1, n))
    route = [0]  # Start at first waypoint
    current = 0
    
    while unvisited:
        nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    
    return route


def optimize_with_ortools(waypoints: List[Waypoint]) -> List[int]:
    """Optimize route using Google OR-Tools"""
    if len(waypoints) < 2:
        return list(range(len(waypoints)))
    
    n = len(waypoints)
    distance_matrix = calculate_distance_matrix(waypoints)
    
    # Create routing model
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Set search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    
    # Solve
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        index = routing.Start(0)
        route = []
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        return route
    
    # Fallback to nearest neighbor
    return optimize_nearest_neighbor(waypoints)


def calculate_route_metrics(waypoints: List[Waypoint], order: List[int]) -> dict:
    """Calculate total distance and estimated duration for optimized route"""
    total_distance_km = 0.0
    total_duration_minutes = 0
    
    for i in range(len(order) - 1):
        idx1 = order[i]
        idx2 = order[i + 1]
        
        point1 = (waypoints[idx1].latitude, waypoints[idx1].longitude)
        point2 = (waypoints[idx2].latitude, waypoints[idx2].longitude)
        distance_km = geodesic(point1, point2).kilometers
        total_distance_km += distance_km
        
        # Estimate duration (assuming average speed of 50 km/h + service time)
        travel_time = (distance_km / 50) * 60  # minutes
        service_time = waypoints[idx2].estimated_duration_minutes or 30
        total_duration_minutes += int(travel_time + service_time)
    
    return {
        "distance_km": round(total_distance_km, 2),
        "duration_minutes": total_duration_minutes,
    }


@app.post("/optimize")
async def optimize_route(request: OptimizeRequest):
    """Optimize a route given waypoints"""
    if len(request.waypoints) < 2:
        raise HTTPException(status_code=400, detail="At least 2 waypoints required")
    
    # Select algorithm
    if request.algorithm == "nearest_neighbor":
        optimized_order = optimize_nearest_neighbor(request.waypoints)
    elif request.algorithm in ["genetic", "simulated_annealing"]:
        # Use OR-Tools for more complex algorithms
        optimized_order = optimize_with_ortools(request.waypoints)
    else:
        optimized_order = optimize_nearest_neighbor(request.waypoints)
    
    # Reorder waypoints
    optimized_waypoints = [request.waypoints[i] for i in optimized_order]
    
    # Calculate metrics
    metrics = calculate_route_metrics(request.waypoints, optimized_order)
    
    return {
        "optimized_waypoints": [
            {
                "latitude": wp.latitude,
                "longitude": wp.longitude,
                "address": wp.address,
                "service_type": wp.service_type,
                "estimated_duration_minutes": wp.estimated_duration_minutes,
            }
            for wp in optimized_waypoints
        ],
        "distance_km": metrics["distance_km"],
        "duration_minutes": metrics["duration_minutes"],
        "algorithm": request.algorithm,
    }


@app.post("/analyze-gaps")
async def analyze_gaps(request: GapAnalysisRequest):
    """Analyze route for gaps and inefficiencies"""
    # This is a simplified gap analysis
    # In production, this would query the database and perform more sophisticated analysis
    
    gaps = [
        {
            "gap_type": "large_distance",
            "latitude": 0.0,
            "longitude": 0.0,
            "description": "Large distance between consecutive stops detected",
            "suggested_improvement": "Consider reordering stops to minimize travel distance",
            "potential_savings": 15.5,
        },
        {
            "gap_type": "time_gap",
            "latitude": 0.0,
            "longitude": 0.0,
            "description": "Time gap detected in route schedule",
            "suggested_improvement": "Fill gap with nearby jobs from marketplace",
            "potential_savings": 8.2,
        },
    ]
    
    return {
        "route_id": request.route_id,
        "operator_id": request.operator_id,
        "gaps": gaps,
        "total_potential_savings": sum(g["potential_savings"] for g in gaps),
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
