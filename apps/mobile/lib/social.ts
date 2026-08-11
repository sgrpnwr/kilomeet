import { api } from './api';

export async function searchUsers(query: string) {
  const res = await api.get('/users', { params: { search: query } });
  return res.data;
}

export async function getFollowing() {
  const res = await api.get('/following');
  return res.data;
}

export async function followUser(userId: string) {
  await api.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: string) {
  await api.delete(`/users/${userId}/follow`);
}

export async function giveKudos(activityId: string) {
  await api.post(`/activities/${activityId}/kudos`);
}

export async function removeKudos(activityId: string) {
  await api.delete(`/activities/${activityId}/kudos`);
}

export async function getComments(activityId: string) {
  const res = await api.get(`/activities/${activityId}/comments`);
  return res.data;
}

export async function postComment(activityId: string, text: string) {
  const res = await api.post(`/activities/${activityId}/comments`, { text });
  return res.data;
}