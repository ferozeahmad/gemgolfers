export interface Tour {
    id: string;
    name: string;
    description: string;
    startDate: string; // or Date, depending on how you handle dates
    endDate: string; // or Date
    tournaments: any[]; // Assuming an array of tournament objects/IDs
    members: any[]; // Assuming an array of member objects/IDs
    // Add other properties as needed based on your backend data structure
}