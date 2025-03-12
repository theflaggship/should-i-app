// frontend/utils/timeConversions.js

export function getTimeElapsed(createdAt) {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}y`;
  }
  
  export function formatDetailedDate(createdAt) {
    if (!createdAt) return '';
    const dateObj = new Date(createdAt);
    const options = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    let formatted = dateObj.toLocaleString('en-US', options);
    formatted = formatted.replace(',', '');
    formatted = formatted.replace(',', ' at');
    return formatted;
  }
  