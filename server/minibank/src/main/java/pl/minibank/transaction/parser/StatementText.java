package pl.minibank.transaction.parser;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

final class StatementText {

    private static final Charset WINDOWS_1250 = Charset.forName("windows-1250");

    private StatementText() {
    }

    static String read(InputStream inputStream) throws IOException {
        byte[] bytes = inputStream.readAllBytes();
        String text;
        try {
            text = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString();
        } catch (CharacterCodingException e) {
            text = new String(bytes, WINDOWS_1250);
        }
        return text.startsWith("﻿") ? text.substring(1) : text;
    }
}
