export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentType = 'flood' | 'fire' | 'earthquake' | 'rescue' | 'medical' | 'infrastructure' | 'storm';
export type ResponderRole = 'all' | 'fire_department' | 'flood_rescue' | 'medical' | 'police';
export type DataSourceType = 'tweet' | 'image' | 'manual_report';
export type CoordinationStatus = 'not_started' | 'in_progress' | 'completed';

export interface SimulatedTweet {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  location?: string;
  isRandom?: boolean;
}

export interface ManualReport {
  id: string;
  location: string;
  description: string;
  timestamp: Date;
  imageUrl?: string;
}

export interface ProcessingLog {
  id: string;
  timestamp: Date;
  source: DataSourceType;
  sourceId: string;
  stage: 'edge_filter' | 'ai_analysis' | 'alert_generation' | 'queue_distribution';
  message: string;
  result?: string;
  priority?: Priority;
  incidentType?: IncidentType;
}

export interface Alert {
  id: string;
  priority: Priority;
  incidentType: IncidentType;
  location: string;
  description: string;
  timestamp: Date;
  coordinates: { lat: number; lng: number };
  sourceType: DataSourceType;
  sourceId: string;
  responderRoles: ResponderRole[];
}

export interface FeedItem {
  id: string;
  type: DataSourceType;
  content: string;
  timestamp: Date;
  location?: string;
}

export interface CoordinationNote {
  id: string;
  dispatchId: string;
  author: string;
  role: ResponderRole;
  text: string;
  timestamp: Date;
}

export interface TeamAssignment {
  role: ResponderRole;
  status: CoordinationStatus;
  updatedAt: Date;
}

export interface DispatchReport {
  id: string;
  alertId: string;
  criticality: Priority;
  peopleAffected: number;
  location: string;
  coordinates: { lat: number; lng: number };
  incidentType: IncidentType;
  assignedRoles: ResponderRole[];
  teamAssignments: TeamAssignment[];
  notes: string;
  contactInfo?: string;
  resourcesNeeded?: string;
  timestamp: Date;
  status: 'pending' | 'dispatched' | 'acknowledged' | 'resolved';
  coordinationNotes: CoordinationNote[];
}

export interface DispatchLogEntry {
  id: string;
  dispatchId: string;
  action: 'created' | 'team_assigned' | 'status_update' | 'note_added' | 'resolved';
  details: string;
  role?: ResponderRole;
  timestamp: Date;
}

export interface TeamResponse {
  id: string;
  dispatchReportId: string;
  alertId: string;
  respondingRole: ResponderRole;
  teamLeader: string;
  teamSize: number;
  eta: string;
  equipmentDeployed: string;
  currentStatus: 'en_route' | 'on_scene' | 'resolved' | 'need_backup';
  situationUpdate: string;
  casualties: number;
  rescued: number;
  hazards: string;
  accessRoute: string;
  timestamp: Date;
}
