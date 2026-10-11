/**
 * documento.schema.ts — contrato Zod del documento InSoft `kind:"config"` que el visor consume.
 *
 * Tolerante a propósito: las claves que el visor no lee pasan (`.loose()`), así un documento viejo
 * sigue cargando. Lo que sí se exige es lo que el visor usa para pintar (summary, templates
 * conocidos, ids de catálogo que resuelven). El host que produce el documento (ISS) aplica su
 * propio schema estricto; este es el del consumidor.
 *
 * Módulo aparte del bundle: `config.ts` lo carga con `import()` solo al validar, así zod no entra
 * en `all.min.js`.
 */
import { z } from '../base/zod.js';
export declare const METODOS_DOC: readonly ["get", "post", "put", "patch", "delete", "query", "options", "head"];
/** Templates de respuesta que `insoft-config.ts::buildResponses` sabe traducir. */
export declare const TEMPLATES_RESPUESTA: readonly ["ok", "auth", "authForbidden", "authNotFound", "deleteEnvelope", "raw"];
export declare const ZDocServidor: z.ZodObject<{
    url: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const ZDocNav: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requiresSession: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const ZDocViewer: z.ZodObject<{
    ns: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
    auth: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        loginKind: z.ZodOptional<z.ZodString>;
        loginPath: z.ZodOptional<z.ZodString>;
        loginUrl: z.ZodOptional<z.ZodString>;
        app: z.ZodOptional<z.ZodString>;
        provider: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
    exports: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    nav: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requiresSession: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>>>;
    servers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>>;
}, z.core.$loose>;
export declare const ZDocTag: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    subgroups: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>>;
}, z.core.$loose>;
export declare const ZDocRespuestas: z.ZodObject<{
    template: z.ZodEnum<{
        ok: "ok";
        auth: "auth";
        raw: "raw";
        authForbidden: "authForbidden";
        authNotFound: "authNotFound";
        deleteEnvelope: "deleteEnvelope";
    }>;
    description: z.ZodOptional<z.ZodString>;
    payload: z.ZodOptional<z.ZodString>;
    schema: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        example: z.ZodOptional<z.ZodUnknown>;
        payload: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>>;
}, z.core.$loose>;
export declare const ZDocOperacion: z.ZodObject<{
    summary: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    subgroup: z.ZodOptional<z.ZodString>;
    security: z.ZodOptional<z.ZodEnum<{
        bearer: "bearer";
        Bearer: "Bearer";
        none: "none";
    }>>;
    doc: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        in: z.ZodEnum<{
            header: "header";
            path: "path";
            query: "query";
            cookie: "cookie";
        }>;
    }, z.core.$loose>>>;
    requestBody: z.ZodOptional<z.ZodObject<{
        bodyKey: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$loose>>;
    responses: z.ZodOptional<z.ZodObject<{
        template: z.ZodEnum<{
            ok: "ok";
            auth: "auth";
            raw: "raw";
            authForbidden: "authForbidden";
            authNotFound: "authNotFound";
            deleteEnvelope: "deleteEnvelope";
        }>;
        description: z.ZodOptional<z.ZodString>;
        payload: z.ZodOptional<z.ZodString>;
        schema: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            description: z.ZodOptional<z.ZodString>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            example: z.ZodOptional<z.ZodUnknown>;
            payload: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>>>;
    }, z.core.$loose>>;
    tryitConfirm: z.ZodOptional<z.ZodString>;
    tryitAttachments: z.ZodOptional<z.ZodUnknown>;
}, z.core.$loose>;
export declare const ZDocCatalog: z.ZodObject<{
    docs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    payloads: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    requestBodies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    schemas: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    tryitConfirm: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tryitAttachments: z.ZodOptional<z.ZodObject<{
        templates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const ZInsoftConfig: z.ZodObject<{
    kind: z.ZodLiteral<"config">;
    version: z.ZodOptional<z.ZodNumber>;
    info: z.ZodOptional<z.ZodObject<{
        title: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
    viewer: z.ZodOptional<z.ZodObject<{
        ns: z.ZodOptional<z.ZodString>;
        brand: z.ZodOptional<z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>>;
        auth: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            loginKind: z.ZodOptional<z.ZodString>;
            loginPath: z.ZodOptional<z.ZodString>;
            loginUrl: z.ZodOptional<z.ZodString>;
            app: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>>;
        exports: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        nav: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            icon: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
            requiresSession: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>>>;
        servers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>>>;
    }, z.core.$loose>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        subgroups: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            icon: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>>>;
    }, z.core.$loose>>>;
    paths: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodEnum<{
        head: "head";
        options: "options";
        get: "get";
        post: "post";
        put: "put";
        patch: "patch";
        delete: "delete";
        query: "query";
    }> & z.core.$partial, z.ZodObject<{
        summary: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        subgroup: z.ZodOptional<z.ZodString>;
        security: z.ZodOptional<z.ZodEnum<{
            bearer: "bearer";
            Bearer: "Bearer";
            none: "none";
        }>>;
        doc: z.ZodOptional<z.ZodString>;
        parameters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            in: z.ZodEnum<{
                header: "header";
                path: "path";
                query: "query";
                cookie: "cookie";
            }>;
        }, z.core.$loose>>>;
        requestBody: z.ZodOptional<z.ZodObject<{
            bodyKey: z.ZodOptional<z.ZodString>;
            content: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$loose>>;
        responses: z.ZodOptional<z.ZodObject<{
            template: z.ZodEnum<{
                ok: "ok";
                auth: "auth";
                raw: "raw";
                authForbidden: "authForbidden";
                authNotFound: "authNotFound";
                deleteEnvelope: "deleteEnvelope";
            }>;
            description: z.ZodOptional<z.ZodString>;
            payload: z.ZodOptional<z.ZodString>;
            schema: z.ZodOptional<z.ZodString>;
            items: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                description: z.ZodOptional<z.ZodString>;
                schema: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
                example: z.ZodOptional<z.ZodUnknown>;
                payload: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>>>;
        }, z.core.$loose>>;
        tryitConfirm: z.ZodOptional<z.ZodString>;
        tryitAttachments: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$loose>>>;
    catalog: z.ZodOptional<z.ZodObject<{
        docs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        payloads: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        requestBodies: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        schemas: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        tryitConfirm: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        tryitAttachments: z.ZodOptional<z.ZodObject<{
            templates: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$loose>>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export type TInsoftConfig = z.infer<typeof ZInsoftConfig>;
/** Resultado de validar: `errores` trae cada problema con su ruta (`paths › /x › get › doc: …`). */
export type TValidacionDocumento = {
    ok: boolean;
    errores: string[];
};
export declare function validarDocumento(doc: unknown): TValidacionDocumento;
