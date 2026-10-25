//Importaciones:
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JS:
export const byCreatedDesc = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
export const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es");

const useUserCollection = (name, { sort, errorMessage } = {}) => {
  const { user } = useAuth();
  const [state, setState] = useState({ data: [], loading: true, error: "" });

  useEffect(() => {
    if (!user?.uid) {
      setState({ data: [], loading: false, error: "" });
      return undefined;
    }

    const userQuery = query(collection(db, name), where("userId", "==", user.uid));

    return onSnapshot(
      userQuery,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        setState({ data: sort ? data.sort(sort) : data, loading: false, error: "" });
      },
      (error) => {
        console.error(error);
        setState({
          data: [],
          loading: false,
          error: errorMessage || `No se pudieron cargar los datos (${name}).`,
        });
      },
    );
  }, [user?.uid, name]);

  return [
    state.data,
    state.loading,
    state.error,
    (updater) => setState((s) => ({ ...s, data: updater(s.data) })),
  ];
};

export default useUserCollection;
