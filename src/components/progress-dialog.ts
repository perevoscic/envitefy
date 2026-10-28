let dialogRequest: Promise<typeof import("@radix-ui/react-dialog")> | undefined;

/** Share the editor prompt chunk, while allowing a failed network request to retry. */
export function loadProgressDialog() {
  dialogRequest ??= import("@radix-ui/react-dialog").catch((error) => {
    dialogRequest = undefined;
    throw error;
  });
  return dialogRequest;
}
