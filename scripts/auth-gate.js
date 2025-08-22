// Shared Auth Gate
(function () {
    const key = 'session_user_v1';
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, 'Guest');
})();
