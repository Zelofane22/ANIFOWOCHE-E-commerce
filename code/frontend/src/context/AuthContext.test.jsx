import { act, render, waitFor } from "@testing-library/react";
import { useContext, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMe, loginUser, registerUser } from "../api/auth.js";
import { AUTH_LOGIN_EVENT } from "../api/axios.js";
import { AuthProvider } from "./AuthContext.jsx";
import { AuthContextValue } from "./authContextValue.js";
import { clearTokens, getAccessToken, setTokens } from "../utils/tokenStorage.js";
import { startTokenRefresher, stopTokenRefresher } from "../utils/tokenRefresher.js";

vi.mock("@sentry/react", () => ({
  setUser: vi.fn(),
}));

vi.mock("../api/auth.js", () => ({
  fetchMe: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

vi.mock("../api/seller.js", () => ({
  registerSeller: vi.fn(),
}));

vi.mock("../utils/tokenStorage.js", () => ({
  getAccessToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock("../utils/tokenRefresher.js", () => ({
  startTokenRefresher: vi.fn(),
  stopTokenRefresher: vi.fn(),
}));

const me = { id: 1, username: "fofo" };
const tokens = { access: "access-token", refresh: "refresh-token" };

const authRef = { current: null };
function AuthProbe() {
  const value = useContext(AuthContextValue);
  useEffect(() => {
    authRef.current = value;
  }, [value]);
  return null;
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("au montage sans token, loading passe à false et user reste null sans appeler fetchMe", async () => {
    getAccessToken.mockReturnValue(null);

    renderAuth();

    await waitFor(() => expect(authRef.current.loading).toBe(false));
    expect(authRef.current.user).toBeNull();
    expect(authRef.current.isAuthenticated).toBe(false);
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("au montage avec un token, fetchMe est appelé et son résultat peuple user", async () => {
    getAccessToken.mockReturnValue("access-token");
    fetchMe.mockResolvedValue(me);

    renderAuth();

    await waitFor(() => expect(authRef.current.loading).toBe(false));
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(authRef.current.user).toEqual(me);
    expect(authRef.current.isAuthenticated).toBe(true);
    expect(startTokenRefresher).toHaveBeenCalled();
  });

  it("si fetchMe échoue au montage, clearTokens est appelé et user reste null", async () => {
    getAccessToken.mockReturnValue("access-token");
    fetchMe.mockRejectedValue(new Error("token invalide"));

    renderAuth();

    await waitFor(() => expect(authRef.current.loading).toBe(false));
    expect(clearTokens).toHaveBeenCalled();
    expect(stopTokenRefresher).toHaveBeenCalled();
    expect(authRef.current.user).toBeNull();
    expect(authRef.current.isAuthenticated).toBe(false);
  });

  it("login appelle loginUser puis setTokens puis fetchMe, peuple user et déclenche AUTH_LOGIN_EVENT", async () => {
    getAccessToken.mockReturnValue(null);
    loginUser.mockResolvedValue(tokens);
    fetchMe.mockResolvedValue(me);
    const listener = vi.fn();
    window.addEventListener(AUTH_LOGIN_EVENT, listener);

    renderAuth();
    await act(async () => {
      await authRef.current.login({ username: "fofo", password: "secret" });
    });

    expect(loginUser).toHaveBeenCalledWith({ username: "fofo", password: "secret" });
    expect(setTokens).toHaveBeenCalledWith(tokens);
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(authRef.current.user).toEqual(me);
    expect(authRef.current.isAuthenticated).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_LOGIN_EVENT, listener);
  });

  it("register appelle registerUser, setTokens, peuple user avec data.user et déclenche AUTH_LOGIN_EVENT", async () => {
    getAccessToken.mockReturnValue(null);
    registerUser.mockResolvedValue({ ...tokens, user: me });
    const listener = vi.fn();
    window.addEventListener(AUTH_LOGIN_EVENT, listener);

    renderAuth();
    await act(async () => {
      await authRef.current.register({ username: "fofo", email: "fofo@example.com", password: "secret" });
    });

    expect(registerUser).toHaveBeenCalledWith({ username: "fofo", email: "fofo@example.com", password: "secret" });
    expect(setTokens).toHaveBeenCalledWith({ ...tokens, user: me });
    expect(authRef.current.user).toEqual(me);
    expect(authRef.current.isAuthenticated).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_LOGIN_EVENT, listener);
  });

  it("logout appelle clearTokens et remet user à null", async () => {
    getAccessToken.mockReturnValue("access-token");
    fetchMe.mockResolvedValue(me);

    renderAuth();
    await waitFor(() => expect(authRef.current.isAuthenticated).toBe(true));

    act(() => authRef.current.logout());

    expect(clearTokens).toHaveBeenCalled();
    expect(authRef.current.user).toBeNull();
    expect(authRef.current.isAuthenticated).toBe(false);
    expect(stopTokenRefresher).toHaveBeenCalled();
  });
});
