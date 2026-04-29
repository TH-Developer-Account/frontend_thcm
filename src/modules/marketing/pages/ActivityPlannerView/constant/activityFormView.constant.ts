// dummyComments.ts

import type { CommentItem } from "../components/CommentsSection";

export const dummyComments: CommentItem[] = [
	{
		id: "c1",
		comment: "Please verify the event budget before submission.",
		createdAt: "2026-04-28T10:00:00Z",
		user: {
			id: "u1",
			name: "Rahul Sharma",
			role: "Manager",
		},
		// replies: [
		// 	{
		// 		id: "r1",
		// 		comment: "Budget updated, please review again.",
		// 		createdAt: "2026-04-28T11:30:00Z",
		// 		user: {
		// 			id: "u2",
		// 			name: "Mon Mon",
		// 			role: "Requester",
		// 		},
		// 	},
		// ],
	},
	{
		id: "c2",
		comment:
			"Venue details look good. Make sure vendor confirmation is attached.",
		createdAt: "2026-04-28T14:20:00Z",
		user: {
			id: "u3",
			name: "Priya Nair",
			role: "Finance",
		},
		replies: [],
	},
	{
		id: "c3",
		comment: "Timeline is tight. Can we extend the execution window by 2 days?",
		createdAt: "2026-04-29T09:15:00Z",
		user: {
			id: "u4",
			name: "Arjun Reddy",
			role: "Approver",
		},
		// replies: [
		// 	{
		// 		id: "r2",
		// 		comment: "Yes, updated the dates accordingly.",
		// 		createdAt: "2026-04-29T09:45:00Z",
		// 		user: {
		// 			id: "u2",
		// 			name: "Mon Mon",
		// 			role: "Requester",
		// 		},
		// 	},
		// 	{
		// 		id: "r3",
		// 		comment: "Approved from my side 👍",
		// 		createdAt: "2026-04-29T10:00:00Z",
		// 		user: {
		// 			id: "u1",
		// 			name: "Rahul Sharma",
		// 			role: "Manager",
		// 		},
		// 	},
		// ],
	},
];
