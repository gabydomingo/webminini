# Ticket para Supabase Support — listo para copiar y pegar

Mandalo desde el dashboard: **[supabase.com/dashboard/support/new](https://supabase.com/dashboard/support/new)**
Categoría: *Billing / Account* o *Other*. Va en inglés, que es lo que atienden más rápido.

Cuesta cero y no te compromete a nada. Aunque termines pagando Pro, conviene tenerlo en cola: si el pago no destraba el restore, ya tenés el reclamo abierto con fecha.

---

**Subject:** Cannot restore paused project — storage archive size limit blocks unpause

**Message:**

> Hi,
>
> Project ref: `cvgnpyzgglrclzxxlbsp` (region sa-east-1)
>
> My project is paused and I am unable to restore it. When I click "Restore project" in the dashboard I get:
>
> `Failed to create storage archive: The project storage size of 3.4 GB exceeds the limit for the storage archive.`
>
> I also confirmed via the S3 endpoint that storage is intentionally gated:
> `HTTP 540 — Project paused. Please unpause the project before proceeding.`
>
> I understand my storage is over the Free plan limit — that is exactly what I am trying to fix. The problem is circular: I cannot reduce storage because I cannot access the project, and I cannot access the project because storage is too large.
>
> My database backup is safe, but the ~2800 image files in the `propiedades` bucket exist nowhere else, and my production site is down without them.
>
> Could you please help with either:
>
> 1. Raising the storage archive limit once so the restore can complete, or
> 2. Granting temporary read-only access to Storage so I can download the files, or
> 3. Exporting the bucket for me
>
> I have already prepared the migration: I will compress the images to WebP (~2.7 GB → ~400 MB) and move them to external object storage, then delete the Supabase bucket entirely. After that the project will be far below the 1 GB Free limit and will stay there.
>
> One more question, so I can decide how to proceed: **if I upgrade this organization to Pro, will the restore succeed?** I want to confirm before paying, since the error appears to be about the archive limit rather than the plan itself.
>
> Thanks,
> Gabriel

---

## Por qué está escrito así

- **Da los datos duros primero** (project ref, error textual, el 540). Les ahorra el ida y vuelta de "¿podés mandarnos el mensaje exacto?".
- **Nombra el círculo vicioso.** Es el argumento más fuerte que tenés: no es que no quieras cumplir el límite, es que no podés.
- **Ofrece tres salidas.** Cuanto más fácil se lo dejes, más rápido contestan.
- **Muestra que el problema no se repite.** Que sepan que después de esto quedás en 400 MB y no vuelven a saber de vos.
- **Pregunta lo del Pro por escrito.** Esta es la parte que te ahorra los USD 25 si la respuesta es "no, el upgrade no lo destraba".

## Después de mandarlo

Anotá el número de ticket. Si en 4–5 días hábiles no hay respuesta, respondé sobre el mismo hilo (no abras uno nuevo: perdés la antigüedad en la cola).
