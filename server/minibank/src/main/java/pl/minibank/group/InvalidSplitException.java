package pl.minibank.group;

import pl.minibank.common.exception.BadRequestException;

/** Invalid split definition; mapped to HTTP 400 by the shared BadRequestException handler. */
public class InvalidSplitException extends BadRequestException {

    public InvalidSplitException(String message) {
        super(message);
    }
}
