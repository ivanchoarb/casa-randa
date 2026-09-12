import type { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "./supabase-client";

/**
 * @refinedev/supabase no trae un authProvider — cada app lo escribe
 * sobre supabaseClient.auth. Roles vienen de la tabla `perfiles`
 * (ver supabase/migrations/0001_perfiles.sql), no de auth.users.
 */
export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        success: false,
        error: { name: "LoginError", message: error.message },
      };
    }

    if (data?.session) {
      return { success: true, redirectTo: "/" };
    }

    return {
      success: false,
      error: { name: "LoginError", message: "No se pudo iniciar sesión." },
    };
  },

  logout: async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      return { success: false, error: { name: "LogoutError", message: error.message } };
    }
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: "/login" };
  },

  onError: async (error) => {
    if (error?.status === 401 || error?.status === 403) {
      return { redirectTo: "/login", logout: true, error };
    }
    return { error };
  },

  getIdentity: async () => {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) return null;

    const { data: perfil } = await supabaseClient
      .from("perfiles")
      .select("nombre, rol, permisos")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email,
      nombre: perfil?.nombre ?? data.user.email,
      rol: perfil?.rol,
      permisos: perfil?.permisos ?? {},
    };
  },
};
