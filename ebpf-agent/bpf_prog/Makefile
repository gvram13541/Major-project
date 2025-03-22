CFLAGS := -O2 -target bpf -I /usr/include/linux -I ./headers

BPF_OBJ := packet_counter.o

packet_counter.o: packet_counter.c
	clang $(CFLAGS) -c packet_counter.c -o $(BPF_OBJ)

