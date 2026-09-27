"use server";

import { getUserSession } from "@/lib/auth/auth";
import { hasRole } from "@/lib/auth/permissions";
import {
    deleteDirectory,
    deleteFile,
    listDirectoryContents,
    moveFile,
    renameItem
} from "@/lib/file-operations";

export async function getStorageItems(relativePath: string = "") {
    const session = await getUserSession();
    if (!hasRole(session?.user?.role, "admin")) throw new Error("Unauthorized");

    return await listDirectoryContents(relativePath);
}

export async function renameStorageItem(oldPath: string, newName: string) {
    const session = await getUserSession();
    if (!hasRole(session?.user?.role, "admin")) throw new Error("Unauthorized");

    return await renameItem(oldPath, newName);
}

export async function deleteStorageItem(relativePath: string, isDir: boolean) {
    const session = await getUserSession();
    if (!hasRole(session?.user?.role, "admin")) throw new Error("Unauthorized");

    if (isDir) {
        return await deleteDirectory(relativePath);
    } else {
        return await deleteFile(relativePath);
    }
}

export async function moveStorageItem(oldPath: string, newDirPath: string) {
    const session = await getUserSession();
    if (!hasRole(session?.user?.role, "admin")) throw new Error("Unauthorized");

    return await moveFile(oldPath, newDirPath);
}
