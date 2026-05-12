package com.opengartic;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para guardar y recuperar dibujos (PNG base64) de DynamoDB.
 *
 * Tabla DynamoDB: chachara-dibujos
 *   PK: id_sala   (String)  – UUID de la sala
 *   SK: id_imagen (String)  – "{idJugador}_{ordenRonda}"
 *   Attr: contenido_base64  – PNG en base64 (sin prefijo data:)
 *   Attr: timestamp         – Epoch millis
 *
 * La clave completa guardada en pasos_cadena.contenido es:
 *   "{idSala}/{idJugador}_{ordenRonda}"
 */
@Service
public class DibujoService {

    private final DynamoDbClient dynamoDB;

    @Value("${aws.dynamo.table.dibujos:chachara-dibujos}")
    private String tableName;

    @Autowired
    public DibujoService(DynamoDbClient dynamoDB) {
        this.dynamoDB = dynamoDB;
    }

    /**
     * Guarda el dibujo en DynamoDB.
     * @param idSala       UUID de la sala (String)
     * @param idJugador    UUID del jugador (String)
     * @param ordenRonda   Número de ronda (1, 2, 3...)
     * @param base64       Contenido PNG en base64 puro (sin "data:image/png;base64,")
     * @return La clave compuesta "{idSala}/{idJugador}_{ordenRonda}" para guardar en pasos_cadena
     */
    public String guardarDibujo(String idSala, String idJugador, int ordenRonda, String base64) {
        String sk  = idJugador + "_" + ordenRonda;
        String key = idSala + "/" + sk;

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("id_sala",          AttributeValue.builder().s(idSala).build());
        item.put("id_imagen",        AttributeValue.builder().s(sk).build());
        item.put("contenido_base64", AttributeValue.builder().s(base64).build());
        item.put("timestamp",        AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

        dynamoDB.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build());

        return key;
    }

    /**
     * Recupera el dibujo de DynamoDB.
     * @param key "{idSala}/{idJugador}_{ordenRonda}"
     * @return base64 puro del PNG, o null si no se encontró
     */
    public String obtenerDibujo(String key) {
        if (key == null || !key.contains("/")) return null;

        int slashIdx = key.indexOf('/');
        String idSala = key.substring(0, slashIdx);
        String sk     = key.substring(slashIdx + 1);

        try {
            GetItemResponse resp = dynamoDB.getItem(GetItemRequest.builder()
                    .tableName(tableName)
                    .key(Map.of(
                            "id_sala",   AttributeValue.builder().s(idSala).build(),
                            "id_imagen", AttributeValue.builder().s(sk).build()
                    ))
                    .build());

            if (resp.hasItem() && resp.item().containsKey("contenido_base64")) {
                return resp.item().get("contenido_base64").s();
            }
        } catch (Exception e) {
            System.err.println("⚠️ DynamoDB error al obtener dibujo [" + key + "]: " + e.getMessage());
        }
        return null;
    }
}